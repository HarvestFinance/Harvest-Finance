/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

import type { DebuggerShellPreparationResult } from "../types/DevToolLauncher";
/**
 * Default `DevToolLauncher` implementation which handles opening apps on the
 * local machine.
 */
declare const DefaultToolLauncher: {
  launchDebuggerAppWindow: (url: string) => Promise<void>;
  launchDebuggerShell(url: string, windowKey: string): Promise<void>;
  prepareDebuggerShell(
    prebuiltBinaryPath?: null | undefined | string,
  ): Promise<DebuggerShellPreparationResult>;
};
declare const $$EXPORT_DEFAULT_DECLARATION$$: typeof DefaultToolLauncher;
declare type $$EXPORT_DEFAULT_DECLARATION$$ =
  typeof $$EXPORT_DEFAULT_DECLARATION$$;
export default $$EXPORT_DEFAULT_DECLARATION$$;
