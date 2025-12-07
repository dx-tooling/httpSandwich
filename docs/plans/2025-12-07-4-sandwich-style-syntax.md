# Sandwich-Style CLI Syntax

## Summary

Add alternative CLI argument syntax that embraces the "sandwich" metaphor:

- `httpSandwich between 8001 and localhost:5678` (natural language)
- `httpSandwich --between 8001 --and localhost:5678` (dashed flags)

Both new forms are equivalent to the existing `--from`/`--to` syntax, which remains supported.

## Supported Syntaxes (All Equivalent)

```bash
# Existing (keep for backward compatibility)
httpSandwich --from 8001 --to localhost:5678

# New: dashed style
httpSandwich --between 8001 --and localhost:5678

# New: natural language style
httpSandwich between 8001 and localhost:5678

# Mixing allowed
httpSandwich between 8001 --and localhost:5678
httpSandwich --between 8001 and localhost:5678
```

## Files to Modify

### [src/cli/argument-parser.ts](src/cli/argument-parser.ts)

Update `parseArguments()` to recognize:

- `--between` and `between` as aliases for `--from`
- `--and` and `and` as aliases for `--to`

Key changes:

1. Detect `between` (no dash) followed by a port value
2. Detect `and` (no dash) followed by a host:port value
3. Continue supporting `--from`/`--to` as primary
4. Allow any combination of the above

Update `getUsage()` to show both syntaxes prominently, with the sandwich style featured first.

### [tests/unit/cli/argument-parser.test.ts](tests/unit/cli/argument-parser.test.ts)

Add test cases for:

- `between X and Y` (natural language)
- `--between X --and Y` (dashed)
- Mixed forms (`between X --and Y`, etc.)
- Backward compatibility (`--from`/`--to` still works)
- Edge cases (missing values, invalid ports)

## Implementation Notes

- The parser already loops through args; extend the conditions to match the new keywords
- Non-dashed `between`/`and` are positional but still need to be followed by their values
- Error messages should mention both syntaxes: "Missing required argument: --from/between"

## Updated Usage Text

```
Usage: httpSandwich between <port> and <host:port> [options]
       httpSandwich --from <port> --to <host:port> [options]

Arguments:
  between, --from, --between <port>       Local port to listen on
  and, --to, --and <host:port>            Target address to proxy to

Examples:
  httpSandwich between 8000 and 5009
  httpSandwich between 8000 and localhost:5009 --level 1
  httpSandwich --from 8000 --to 192.168.1.5:80 --history 50
```
