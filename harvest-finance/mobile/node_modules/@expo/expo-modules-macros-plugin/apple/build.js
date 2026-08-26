#!/usr/bin/env node

const childProcess = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { promisify } = require('node:util');

const execFile = promisify(childProcess.execFile);

/**
 * Runs a command and resolves when it exits successfully.
 */
function spawnAsync(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(command, args, { stdio: 'inherit', ...options });
    child.once('error', reject);
    child.once('close', (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`\`${command} ${args.join(' ')}\` exited with ${signal ?? `code ${code}`}`));
      }
    });
  });
}

/**
 * Builds the macro plugin for the given architecture and returns the path to the built binary.
 * SwiftPM always builds macro tools for the host architecture, so the x86_64 slice
 * is built by running the whole toolchain under Rosetta with `arch -${arch}`.
 */
async function buildForArch(arch) {
  const buildArgs = ['build', '-c', 'release'];
  if (arch === os.machine()) {
    await spawnAsync('swift', buildArgs, { cwd: __dirname });
  } else {
    await spawnAsync('arch', [`-${arch}`, 'swift', ...buildArgs], { cwd: __dirname });
  }

  const binPath = path.join(__dirname, `.build/${arch}-apple-macosx/release/ExpoModulesMacros-tool`);
  try {
    await fs.access(binPath);
  } catch {
    throw new Error(`Could not find the built ExpoModulesMacros-tool at ${binPath}`);
  }
  return binPath;
}

/**
 * Checks whether the Swift toolchain actually runs for the given architecture by
 * verifying the host target triple it reports, e.g. `Target: x86_64-apple-macosx26.0`
 * under Rosetta. Exit status alone is not enough: if `arch` ever fell back to the
 * native architecture, the probe would pass but the build would produce a wrong slice.
 */
async function canRunSwiftForArch(arch) {
  try {
    const { stdout } = await execFile('arch', [`-${arch}`, 'swift', '--version']);
    return stdout.includes(`${arch}-apple`);
  } catch {
    return false;
  }
}

/**
 * Checks whether the toolchain can build for the given architecture.
 * Building x86_64 on Apple Silicon requires Rosetta, so when it is missing,
 * try to install it before giving up.
 */
async function canBuildForArch(arch) {
  if (arch === os.machine()) {
    return true;
  }
  if (await canRunSwiftForArch(arch)) {
    return true;
  }
  if (arch === 'x86_64' && os.machine() === 'arm64') {
    try {
      console.log('Installing Rosetta to build the x86_64 slice...');
      await spawnAsync('sudo', ['softwareupdate', '--install-rosetta', '--agree-to-license']);
      return await canRunSwiftForArch(arch);
    } catch {
      // No sudo access or the install failed - fall through to the unsupported arch warning.
    }
  }
  return false;
}

/**
 * Asserts that the built binary contains a slice for each of the given architectures.
 */
async function verifyArchs(binaryPath, archs) {
  const { stdout } = await execFile('lipo', ['-archs', binaryPath]);
  const builtArchs = stdout.trim().split(/\s+/);
  for (const arch of archs) {
    if (!builtArchs.includes(arch)) {
      throw new Error(`The built binary at ${binaryPath} is missing the ${arch} slice`);
    }
  }
}

async function main() {
  const outputPath = path.join(__dirname, 'ExpoModulesMacros-tool');

  const archs = [];
  for (const arch of ['arm64', 'x86_64']) {
    if (await canBuildForArch(arch)) {
      archs.push(arch);
    } else {
      console.warn(`The Swift toolchain cannot run for ${arch} - the built binary will not support ${arch} Macs.`);
    }
  }
  if (archs.length === 0) {
    throw new Error('The Swift toolchain is not available for any supported architecture');
  }

  // Builds run sequentially as SwiftPM locks the shared .build directory.
  const binPaths = [];
  for (const arch of archs) {
    binPaths.push(await buildForArch(arch));
  }

  await fs.rm(outputPath, { force: true });
  if (binPaths.length > 1) {
    await spawnAsync('lipo', ['-create', ...binPaths, '-output', outputPath]);
  } else {
    await fs.copyFile(binPaths[0], outputPath);
  }

  await spawnAsync('strip', [outputPath]);
  await verifyArchs(outputPath, archs);
  await spawnAsync('lipo', ['-info', outputPath]);
}

main().catch((error) => {
  console.error('Build failed:', error.message);
  process.exit(1);
});
