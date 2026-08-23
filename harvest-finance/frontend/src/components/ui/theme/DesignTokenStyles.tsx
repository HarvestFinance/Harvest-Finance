import { cssVariableDeclarations } from './tokens'

export function DesignTokenStyles() {
  return (
    <style
      id="harvest-design-tokens"
      dangerouslySetInnerHTML={{
        __html: `:root {\n  ${cssVariableDeclarations}\n}`,
      }}
    />
  )
}
