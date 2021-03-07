/**
 * Copyright (C) 2014-2015,2017,2021 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */

'use strict';

var getopt = require('./');

module.exports = {
    'should return option': function(t) {
        var opts = getopt("nodejs script.js -v arg1 arg2", "v");
        t.ok(opts.v);
        t.done();
    },

    'should return option from argv': function(t) {
        var opts = getopt(["nodejs", "script.js", "-v", "arg1", "arg2"], "v");
        t.ok(opts.v);
        t.equal(opts._argv[0], "arg1");
        t.done();
    },

    'should return - as an argument': function(t) {
        var opts = getopt("nodejs script.js -v - -x", "vx");
        t.ok(opts.v);
        t.ok(!opts.x);
        t.equal(opts._argv[0], "-");
        t.done();
    },

    'should return long argument names': function(t) {
        var opts = getopt("nodejs script.js --verbose -geometry 80x24 arg1", "(-verbose)(geometry)");
        t.ok(opts.verbose);
        t.ok(opts.geometry);
        t.done();
    },

    'should not return switches from after --': function(t) {
        var opts = getopt("nodejs script.js -x -- -y arg1 arg2", "xy");
        t.ok(opts.x);
        t.ok(!opts.y);
        t.equal(opts._argv[0], "-y");
        t.done();
    },

    'should return option param': function(t) {
        var opts = getopt("nodejs script.js -a foo arg1 arg2", "a:");
        t.equal(opts.a, 'foo');
        t.done();
    },

    'should return option param as string': function(t) {
        var opts = getopt("nodejs script.js -a 012 arg1 arg2", "a:");
        t.equal(opts.a, '012');
        t.done();
    },

    'should return option double param': function(t) {
        var opts = getopt("nodejs script.js -a 12 34 arg1 arg2", "a::");
        t.deepEqual(opts.a, [12, 34]);
        t.done();
    },

    'should parse name=value option': function(t) {
        var opts = getopt("nodejs script.js -a=1 -b=2", "a:b:");
        t.equal(opts.a, 1);
        t.equal(opts.b, 2);
        t.done();
    },

    'should set and return multiple options': function(t) {
        var opts = getopt("nodejs script.js -a 12 -b 34 56 -c 78", "a:b::c");
        t.equal(opts.a, 12);
        t.deepEqual(opts.b, [34, 56]);
        t.ok(opts.c);
        t.equal(opts._argv[0], 78);
        t.done();
    },

    'should return repeated multi-param option': function(t) {
        var opts = getopt("nodejs script.js -a 1 2 -a 3 4 -a 5 6", "a::");
        t.deepEqual(opts.a, [[1,2], [3,4], [5,6]]);
        t.done();
    },

    'should not scan past non-switch argument': function(t) {
        var opts = getopt("nodejs script.js arg1 -a 12", "a:");
        t.ok(!opts.a);
        t.equal(opts._argv[0], 'arg1');
        t.done();
    },

    'should not scan past --': function(t) {
        var opts = getopt("nodejs script.js -- -a 12", "a:");
        t.equal(opts._argv[0], '-a');
        t.done();
    },

    'should return boolean for yes/no option': function(t) {
        var opts = getopt("nodejs script.js -h", "h");
        t.equal(opts.h, true);
        t.equal(typeof opts.h, 'boolean');
        t.done();
    },

    'should return count for repeated yes/no option': function(t) {
        var opts = getopt("nodejs script.js -h -h", "h");
        t.equal(opts.h, 2);
        t.equal(typeof opts.h, 'number');
        t.done();
    },

    'should return array of repeated param option': function(t) {
        var opts = getopt("nodejs script.js -a 1 -b 2 -b 3 -c 4 -b 5", "a:b:c:");
        t.deepEqual(opts.a, 1);
        t.deepEqual(opts.b, [2, 3, 5]);
        t.deepEqual(opts.c, 4);
        t.done();
    },

    'should throw error for unrecognized option': function(t) {
        try { var opts = getopt("nodejs script.js -x", "vc"); t.ok(false, "expected error"); }
        catch (err) { t.ok(err.message.indexOf('unrecognized') >= 0); }
        t.done();
    },

    'should throw error for unrecognized alias': function(t) {
        try { getopt("nodejs script.js -x", { '-x': { alias: '--other' } }); t.ok(false, "expected error") }
        catch (err) { t.ok(err.message.indexOf('unrecognized') >= 0) }
        t.done();
    },

    'should throw on missing argument': function(t) {
        try { getopt("nodejs script.js -x", "x:"); t.ok(false, "expected error") }
        catch (err) { t.ok(err.message.indexOf('missing argument') >= 0) }
        t.done();
    },

    'should throw on alias loop': function(t) {
        try { getopt("nodejs script.js -x", { '-x': { alias: '-x' } }); t.ok(false, "expected error") }
        catch (err) { t.ok(err.message.indexOf('alias loop') >= 0) }
        t.done();
    },

    'should accept empty string argument': function(t) {
        var opts = getopt(["nodejs",  "script.js", "-f", "", "-h", "arg1"], "f:h");
        t.strictEqual(opts.f, "");
        t.strictEqual(opts.h, true);
        t.done();
    },

    'should accept options as an object': function(t) {
        var opts = getopt("nodejs script.js -f ff -h arg1", { '-f': 1, '-h': { argc: 0 } });
        t.equal(opts.f, "ff");
        t.strictEqual(opts.h, true);
        t.equal(opts._argv[0], "arg1");
        t.done();
    },

    'should accept name=value option with options object': function(t) {
        var opts = getopt("nodejs script.js -f=ff -h arg1", { '-f': { argc: 1 }, '-h': 0 });
        t.equal(opts.f, "ff");
        t.equal(opts.h, true);
        t.done();
    },

    'should accept options object aliases': function(t) {
        var opts = getopt("nodejs script.js -f ff -h arg1", { '-f': { alias: '--filename' }, '--filename': 1, '-h': 0 });
        t.equal(opts.filename, "ff");
        t.equal(opts.f, "ff");
        t.equal(opts.h, true);
        t.equal(opts._argv[0], "arg1");
        t.done();
    },

    'getopt.parse': {
        'parse extracts options': function(t) {
            var opts = getopt
                .option('-v, --verbose', 'verbose mode')
                .option('-x, --xpos <X>', 'horizontal position')
                .option('-y, --ypos <Y>', 'vertical position')
                .parse('node test.js -x 11 -v --ypos 22 foo bar');
            t.strictContains(opts, { verbose: true, xpos: '11', ypos: '22', _argv: ['foo', 'bar'] });
            t.done();
        },

        'version and help register switches': function(t) {
            t.ok(getopt.version().parse('node test.js')._recognizedOptions['-V']);
            t.ok(getopt.version().parse('node test.js')._recognizedOptions['--version']);
            t.ok(getopt.help().parse('node test.js')._recognizedOptions['-h']);
            t.ok(getopt.help().parse('node test.js')._recognizedOptions['--help']);
            t.done();
        },

        'version and help switches are not sticky': function(t) {
            getopt.help().version().parse('node test.js');
            t.ok(!getopt.version().parse('node test.js')._recognizedOptions['--help']);
            t.ok(!getopt.help().parse('node test.js')._recognizedOptions['--version']);
            t.done();
        },

        'version prints version and exits': function(t) {
            var output = '';
            var spy = t.stubOnce(process, 'exit');
            t.stubOnce(process.stdout, 'write', function(s) { output += s });
            getopt.program('prog', '1.2.3', 'mock usage').version().parse('node test.js --version');
            t.ok(spy.called);
            t.contains(output, /^1.2.3\n$/);
            t.done();
        },

        'help prints usage and exits': function(t) {
            var output = '';
            var spy = t.stubOnce(process, 'exit');
            t.stubOnce(process.stdout, 'write', function(s) { output += s });
            getopt.program('mockProg', '1.2.3', 'mock usage').version().help().parse('node test.js --help');
            t.ok(spy.called);
            t.contains(output, /^mockProg 1.2.3 -- mock usage/);
            t.contains(output, /-h, --help/);
            t.contains(output, /-V, --version/);
            t.done();
        },

        'help prints generic usage and exits': function(t) {
            var output = '';
            var spy = t.stubOnce(process, 'exit');
            t.stubOnce(process.stdout, 'write', function(s) { output += s });
            getopt.help().parse('node test.js --help');
            t.ok(spy.called);
            t.contains(output, 'script  -- run script');
            t.done();
        },

        'uses provided program name, version and description in the usage message': function(t) {
            var opts = getopt
                .program('mockProg', 'v1.2.3', 'mock program for argument parsing')
                .help()
                .parse('node test.j')
            t.contains(opts._usage, 'mockProg v1.2.3 -- mock program for argument parsing');
            t.done();
        },
    },
};
