/**
 * getopt() -- extract traditional unix command-line arguments
 * Modifies the passed argv array, returns the found options as properties.
 *
 * Traditional unix command options follow the command name and precede the
 * command arguments, so e.g. ls -l /tmp.  Options have to begin with the '-'
 * switch character.  The first argument that does not start with - ends
 * the options scan.  The special argument '--' ends scanning and is skipped,
 * and a - by itself is an argument and not a command option switch.
 * The returned option parameters are always strings, not parsed into numbers.
 *
 * Examples:
 *      argsHash = getopt(argv, "x:y::h(-help)");
 *
 * Copyright (C) 2014-2015,2017-2019,2021 Andras Radics
 * Licensed under the Apache License, Version 2.0
 *
 * 2014-09-28 - AR.
 */

'use strict';

module.exports = function(av,opts) { return getopt(av,opts) };
module.exports.getopt = getopt;
module.exports.nextopt = nextopt;


/**
 * Remove and return the next option from argv, or false.
 * Options start at argv[2] (argv[0] is the program name, argv[1] the script).
 * All other argv elements will be left, including options arguments.
 */
function nextopt( argv ) {
    if (argv._optind === undefined) argv._optind = 2;
    var optind = argv._optind;
    var opt = argv[optind];

    if (opt && opt[0] !== '-') {
        // argument, not an option switch
        return false;
    }
    else if (opt === '-') {
        // - is an argument, not an option switch
        return false;
    }
    else if (opt === '--') {
        // -- ends options, not part of arguments
        argv.splice(2, 1);
        return false;
    }
    else {
        argv.splice(2, 1);
        return opt;
    }
}

/**
 * Extract the command-line switches according to the options template.
 * Options may be a traditional unix options tring eg "ynf:", or an option
 * name to option argument count mapping.  Modifies the input argv,
 * and returns the option switches and switch parameters found.
 * Extended objects tbd later, in getopt-ext.
 */
function getopt( argv, options ) {
    var i, opt, found = {};
    if (typeof argv === 'string') argv = argv.split(' ');

    if (typeof options === 'string') options = parseOptionsString(options);
    else if (typeof options !== 'object') throw new Error('getopt: options must be a string or an options object');
    if (!options.parse) options = normalizeOptionsObject(options);

    var parsedOptions = options;
    options = {};
    for (var key in parsedOptions) options[key] = parsedOptions[key];
    delete options.__usage;

    while ((opt = nextopt(argv, options))) {
        // option '-a' has name 'a'
        var equals, specifiedOpt = opt, name = opt, value;
        var aliasDepth = 0;

        // if aliased, replace the specified name with the alias
        while (options[opt] && options[opt].alias) {
            opt = options[opt].alias;
            name = opt;
            if (++aliasDepth > 1000) throw new Error("getopt alias loop");
        }

        if (options[opt] !== undefined) {
            var argc = (typeof options[opt] === 'number') ? options[opt] : (options[opt].argc || 0);
            if (argc <= 0) value = true;
            else {
                value = argv.splice(2, argc);
                if (value.length < argc || value.indexOf('--') >= 0) {
                    throw new Error(opt + ": missing argument");
                }
                if (value.length === 1) value = value[0];
            }
        }
        else if ((equals = opt.indexOf('=')) > 0 &&
            options[name = opt.slice(0, equals)] &&
            options[name] &&
            (options[name] === 1 || options[name].argc === 1))
        {
            // allow equals-separated option params, eg --value=3
            value = opt.slice(equals+1);
            opt = opt.slice(0, equals);
        }
        else {
            throw new Error(opt + ": unrecognized option");
        }

        // strip the - and -- off the returned options (e.g. -h and --help)
        // Every option must begin with a '-', possibly '--', enforced by nextopt().
        var flag = name;
        name = (name[1] === '-') ? name.slice(2) : name.slice(1);
        var specifiedName = (specifiedOpt[1] === '-') ? specifiedOpt.slice(2) : specifiedOpt.slice(1);

        if (value === true) {
            // leave single yes/no option boolean, convert repeated yes/no option into count
            found[name] = (found[name] ? found[name] + 1 : true);
        }
        else {
            // leave single param flat, convert repeated params into array
            if (found[name] === undefined) {
                // first occurrence of option
                found[name] = value;
            }
            else if (!Array.isArray(value)) {
                // repeated single-arg option, eg "--opt 1 --opt 2 --opt 3" => [1, 2, 3]
                if (!Array.isArray(found[name])) found[name] = new Array(found[name]);
                found[name].push(value);
            }
            else {
                // repeated multi-arg option, eg "--opt 1 2 --opt 3 4" => [[1,2], [2,3]]
                // TODO: make it easier for caller to distinguish one switch args [1,2] from multiple switches [[1,2], [3,4]]
                if (!Array.isArray(found[name][0])) found[name] = new Array(found[name]);
                found[name].push(value);
            }
        }

        // make aliased option available by the specified option name as well
        if (specifiedName !== name) found[specifiedName] = found[name];

        // if this option has a handler function, call it with each value found
        var handler = options[opt].handler;
        if (handler) handler(name, value, options);
    }

    found._program = argv[0];
    found._script = argv[1];
    found._argv = argv.slice(2);
    found._recognizedOptions = options;
    found._usage = parsedOptions.__usage

    return found;
}

/**
 * convert traditional unix getopt string into a primitive options object
 */
function parseOptionsString( string ) {
    var i, j, name, options = {};
    for (i=0; i<string.length; i++) {
        if (string[i] === '(') {
            // support parenthesized long-names (-help) => --help
            var endp = string.indexOf(')', i);
            name = "-" + string.slice(i+1, endp);
            i = endp;
        }
        else {
            name = "-" + string[i];
        }
        options[name] = { argc: 0, usage: '', help: '' };
        for (j=0; string[i+1+j] === ':'; j++) options[name].argc += 1;
        i += j;
    }
    return options;
}


var util = require('util');
var path = require('path');

/**
 * rearrange a user options config into options object format
 * Also assembles the built-in help and attaches it as options.__usage
 */
function normalizeOptionsObject( config ) {
    // do not normalize preformatted config objects
    if (!config.options) return config;

    var name = config.name || process.argv[1] && path.basename(process.argv[1]);
    var version = config.version || '0';
    var description = config.description || '$ node ' + name;
    var switches = config.options;
    var keys = Object.keys(switches);

    var helpMessage = util.format("%s %s -- %s\n", name, version, description);
    if (config.usage) helpMessage += "usage: " + config.usage + "\n";
    else if (!keys.length && !config.showHelp) {
        helpMessage += util.format("usage: %s ...\n", name);
    }
    else {
        helpMessage += util.format("usage: %s [options] ...\n", name)
        helpMessage += "\n";
        helpMessage += "Options:\n";
    }

    // using keys supports both { options: { ... } } and { options: [ ... ] }
    var options = {};
    for (var keyi=0; keyi<keys.length; keyi++) {
        var key = keys[keyi];
        var flag, agrcount, form, usage, handler, alias;
/**
        if (Array.isArray(switches[keys[i]])) {
            if (switches[i].length < 4) throw new Error('config format: [flag, argcount, form, usage, ?handler]');
            flag = switches[i][0];
            flag = flag ? [].concat(flag) : [];
            if (!flag.length) throw new Error('config format: flag name required');
            argcount = [ switches[i][1] ];
            form = switches[i][2];
            usage = switches[i][3];
            handler = switches[i][4];
        } else
**/
        {
            flag = switches[key].flag || switches[key].switches || switches[key].short || switches[key].name || switches[key].n;
            flag = flag ? [].concat(flag) : [];
            flag.unshift(key);
            var argcount = switches[key].argcount || switches[key].argc || switches[key].ac;
            form = switches[key].form || switches[key].format || switches[key].fmt;
            usage = switches[key].h || switches[key].help || switches[key].usage || switches[key].u;
            handler = switches[key].handler || switches[key].run;
            alias = switches[key].alias;
        }

        for (var i=0; i<flag.length; i++) flag[i] = prefixFlagWithDash(flag[i]);
        dedupFlags(flag);
        if (!argcount) argcount = 0;
        if (!form) {
            form = flag.join(', ');
            if (argcount > 0) form += (argcount === 1 ? " <arg>" : util.format(" <%d args>", argcount));
        }
        if (!usage) usage = '';
        if (handler && typeof handler !== 'function') throw new Error('config: handler must be a function');

        options[flag[0]] = { argc: argcount, alias: alias, form: form, usage: usage, handler: handler };
        for (var j=1; j<flag.length; j++) if (!options[flag[j]]) options[flag[j]] = { alias: flag[0] };

        helpMessage += "  " + form + "\n";
        if (usage) helpMessage += "        " + usage + "\n";
    }

    if (config.showHelp === true) {
        var helpSwitches = [];
        if (!options.h) { options.h = { handler: showUsage }; helpSwitches.push('-h') }
        if (!options.help) { options.help = { handler: showUsage }; helpSwitches.push('--help') }
        if (helpSwitches.length > 0) {
            helpMessage += "  " + helpSwitches.join(', ') + "\n";
            helpMessage += "        show this help message\n";
        }
    }
    options.__usage = helpMessage;

    return options;

    function prefixFlagWithDash( flag ) {
        // flags that already specify the dash are left as is, eg '-h', '-name', '--help'
        if (flag[0] === '-') return flag
        // short options use one dash, long options use two dashes
        return (flag.length === 1 ? '-' : '--') + flag;
    }

    function dedupFlags( flag ) {
        // remove duplicates, as from eg { 'z': { name: [ '-z' ] } }
        for (var i=0; i<flag.length; i++) {
            if (flag.lastIndexOf(flag[i]) > i) { flag.splice(i, 1); --i }
        }
    }

    function showUsage() {
        console.log(helpMessage);
        process.exit();
    }
}


function Flags( ) {
    Object.defineProperty(this, '_opts', { enumerable: true, value: {
        name: path.basename(process.argv[1]),
        version: '',
        description: '',
    }})
}
Flags.prototype.name = function name(progName) { this._opts.name = progName; return this };
Flags.prototype.version = function version(version) { version ? this._opts.version = version : parseVersion(this._opts); return this };
Flags.prototype.description = function description(usage) { this._opts.description = usage; return this };
Flags.prototype.option = function option(names, help) { parseOption(this._opts, names, help); return this };
Flags.prototype.help = function help() { parseHelp(this._opts); this._usage = this._opts['--help'].handler(true); return this }
Flags.prototype.parse = function parse(argv) { var opts = getopt(argv, this._opts); opts._usage = this._opts.__usage; return opts }

// names: -u, --user, --username <name of user>
function parseOption( flags, names, help, handler ) {
    var parts = names.split(/[, ]+/);
    var aliases = parts.filter(function(str) { return str[0] === '-' });
    var params = parts.filter(function(str) { return str[0] !== '-' });
    var optionName = aliases.pop();
    // TODO: rename 'usage' to 'help', maybe rename 'form' to 'usage'?
    // maybe: treat [x] params optional: argc vs maxArgc
    flags[optionName] = { argc: params.length, form: names, usage: help, handler: handler };
    for (var i = 0; i < aliases.length; i++) {
        flags[aliases[i]] = { alias: optionName };
    }
}

function parseVersion( flags ) {
    parseOption(flags, '-V, --version', 'show version and exit', function() {
        console.log('%s', flags.version);
        process.exit(0);
    })
}

function parseHelp( flags, description ) {
    parseOption(flags, '-h, --help', 'show usage and exit', function(noexit) {
        // do not sort the usage lines, leave them in user-entered order
        var allUsage = Object.keys(flags)
            .filter(function(k) { return typeof flags[k] === 'object' && !flags[k].alias })
            .map(function(k) { return [flags[k].form || k, flags[k].usage] });
        var longestUsage = allUsage.reduce(function(max, pair) { return Math.max(max, pair[0].length) }, 0);
        var usage = '';
        usage += util.format('%s %s -- %s\n', flags.name, flags.version || '', flags.description || '');
        usage += util.format('usage: %s\n', flags.usage || 'script [options]');
        usage += util.format('\n');
        usage += util.format('options:\n');
        var spaces = new Array(longestUsage + 1).join(' ');
        for (var i = 0; i < allUsage.length; i++) {
            usage += util.format('  %s%s   %s\n', allUsage[i][0], spaces.slice(0, longestUsage - allUsage[i][0].length), allUsage[i][1]);
        }
        if (!noexit) { console.log(usage); process.exit(0); }
        return flags.__usage = usage;
    })
}


/** quicktest:

var opts = new Flags()
    .version('v0.1.0')
    .name('testProg')
    .description('test show usage')
    .option('-x, -w, --width N', 'item width')
    .option('-y, -h, --height M', 'item height')
    .version()
    .help()
    .parse(['node', 'test', '-x', '1', '--width', '2', '--help', 'foo', 'bar'])
    ;

console.log(opts);
//opts._opts['--help'].handler();
//console.log("AR: parse:", opts.parse && opts.parse("node test.js -x 1 -y 2 --help foo bar"));
console.log("AR: Done.");

/**/


// quick test:
// console.log( getopt("js test.js -a 1 -name=value --verbose --value=33 -c -b 2 3 -- -d foo".split(" "), "a:(name):b::c(-verbose)(-value):d:") );
