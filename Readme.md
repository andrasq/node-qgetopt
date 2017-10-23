QGetopt
=======

[![Build Status](https://api.travis-ci.org/andrasq/node-qgetopt.svg?branch=master)](https://travis-ci.org/andrasq/node-qgetopt?branch=master)
[![Coverage Status](https://codecov.io/github/andrasq/node-qgetopt/coverage.svg?branch=master)](https://codecov.io/github/andrasq/node-qgetopt?branch=master)

Simple little traditional Unix command-line option extractor, with enhancements

        var getopt = require('qgetopt').getopt;

        // traditional unix options
        var options = getopt(process.argv, "f:h");
        // ... -f filename -h => { f: 'filename', h: true }

        // long option names
        var options = getopt(process.argv, "(-file):(-help)");
        // ... --file filename --help => { file: 'filename', help: true }

        // multi-parameter options
        var options = getopt(process.argv, "xy::");
        // ... -xy 12 345 => { xy: ['12', '345'] }

        // equals-assigned options
        var options = getopt(process.argv, "(-file):");
        // ... --file=filename => { file: 'filename' }

        // repeated options
        var options = getopt(process.argv, "f:h");
        // ... -f f1 -h -f f2 -h -h => { f: ['f1', 'f2'], h: 3 }


### getopt( argv, optspec )

Returns a hash with the found options, removes the options from the
arguments array.  Modifies the passed array.  Returns the option
parameters as strings, not parsed into numbers.

Traditional unix command options follow the command name and precede the
command arguments, so e.g. `ls -l /tmp`.  Options have to begin with the `-`
switch character.  The first argument that does not start with - ends
the options scan.  The special argument `--` ends scanning and is skipped.
A `-` by itself is an argument and not a command option.

Repeated flag options are counted; "-t -t -t" returns `{t: 3}`.
Repated param options "-a 1 -a 2","a:" are gathered into an array `{a: [1, 2]}`.
Repeated multi-param options "-a 1 2 -a 3 4","a::" are gathered into an
array of arrays `{a: [[1, 2], [3, 4]]}`.

- `argv` is the command-line arguments array to parse in `process.argv`
  format.  The first two elements are 'node' and the name of the source file.
  Arguments following the source file name that begin with a `-` hyphen are taken
  to be option switches, except a single `-` itself (which is a plain argument)
  and those that follow the `--` end-of-option-switches indicator.  It is an
  error if an option is not recognized.

- `optspec` is a string that specifies which options to extract.  The string
  is a superset of the traditional unix `getopt(3)` option specification.

  A plain character 'a' names a single-character option `-a`.

  A parenthesized string '(aa)' names a long option name `-aa`, and '(-aa)'
  matches `--aa`.

  A colon ':' following an option name means that option expects an argument.
  Two colons '::' means it takes two arguments, ':::' means 3, etc.  It is an
  error for any expected argument(s) to be missing.

  - `"h"` - flag, sets {h:true} if `-h` is present
  - `"a:"` - valued option with one argument, sets {a:123} if `-a 123` is present
  - `"a::"` - valued option with two arguments, sets {a:[1,23]} if `-a 1 23` is present
  - `"(aa)"` - long named flag, sets {aa:true} if `-aa` is present
  - `"(-aa)"` - long named double-dash flag, sets {aa:true} if `--aa` is present
  - `"(-aa):"` - long named double-dash flag with one argument

