QGetopt
=======
[![Build Status](https://github.com/andrasq/node-qgetopt/actions/workflows/nodejs.yml/badge.svg)](https://github.com/andrasq/node-qgetopt/actions/workflows/nodejs.yml)
[![Coverage Status](https://coveralls.io/repos/github/andrasq/node-qgetopt/badge.svg?branch=master)](https://coveralls.io/github/andrasq/node-qgetopt?branch=master)

Simple little traditional Unix command-line option extractor, with enhancements

        var getopt = require('qgetopt').getopt;

        // traditional unix options
        var options = getopt(process.argv, "f:h");
        // ... -f filename -h => { f: 'filename', h: true }

        // long option names
        var options = getopt(process.argv, "(-file):(-help)");
        // ... --file filename --help => { file: 'filename', help: true }

        // multi-parameter options
        var options = getopt(process.argv, "(xy)::");
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
Repeated param options "-a 1 -a 2","a:" are gathered into an array `{a: [1, 2]}`.
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

Option names must be left separate e.g. `-a -b` and not combined as `-ab`.  Switches must be
separated from their arguments by a space, or for single-parameter arguments, an `=` equal sign.

    node command.js --count 3
    node command.js --count=3

### getopt.option().comment().version().help().parse( argv )

Configure the options with `.option`, parse arguments array with `.parse`.  All the `option` config
calls chain.

`option(switches, usage)` defines an option switch, its aliases, required parameters, and usage help.
`switches` is one or more dash-prefixed option names followed by placeholders for the required parameters,
all separated by spaces and/or commas; see the example.
If the option has more than one name, the last will be the canonical name and the others will be aliases.
Each call to `option()` (re)defines the named switches, in the order given.

    // define a `width` option taking 1 argument, aliased as `-w` and `-dx`
    getopt.options('-w, -dx, --width <mm>', 'item width')

`comment(text)` includes the text in the help message below the option after which it occurs.

`version()` is a special form of `option()` that installs a switch to print the
program version and exit.  Default switch is `('-V, --version')`.  Note that `version()` redefines
any previous meanings of the `-V` and `--version` switches.

`help()` is a special form of `option()` that installs a switch to format and
print the program usage instructions and exit.  Default switch is `('-h, --help')`.
The help usage message is computed from the `option`-configured usage and help strings.
Note that `help()` redefines any previous meanings of the `-h` and `--help` switches.

    var getopt = require('qgetopt');
    var opts = getopt
        .program('myProgramName', 'v1.2.3', 'demo options config')
        .version()
        .help()
        .option('-w, --width <N>', 'item width in mm')
        .comment('measure accurately')
        .comment('measure twice')
        .option('-l, --length <M>', 'item length in mm')
        .parse(['node', 'script.js', '--help']);

    // --help outputs:
    myProgramName v1.2.3 -- demo options config
    usage: myProgramName [options]

    options:
      -V, --version      print program version and exit
      -h, --help         print program usage help and exit
      -w, --width <N>    item width in mm
                         measure accurately
                         measure twice
      -l, --length <M>   item lenth in mm


Change Log
----------

- 1.3.2 - fix --count=3 equal-assigned options leaking into other flags
- 1.3.1 - fix `--count=3` style equal-assigned argument passing
- 1.3.0 - `comment` usage message
- 1.2.1 - allow trailing spaces in .option switches
- 1.2.0 - remove options object support, add commander-like options config
- 1.1.0 - uncodumented: support an options object
- 1.0.2 - make aliased options available under both names
- 1.0.1 - first released version
