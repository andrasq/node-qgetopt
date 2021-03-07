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

    'parseOptionsObject': {
        'should call handler': function(t) {
            var called = 0;
            getopt("nodejs script.js -h", { options: { 'h':  { handler: function(name, value) {
                t.equal(name, 'h');
                t.equal(value, true);
                called += 1;
            }}}});
            getopt("node s.js --help", { options: { 'help': { handler: function() { called += 1 }}}});
            getopt("node s.js -name", { options: { '-name': { handler: function() { called += 1 }}}});
            t.equal(called, 3);
            t.done();
        },

        'should call handler each time flag is found': function(t) {
            var calls = 0;
            var ycalls = 0;
            var opts = getopt("node js -x -y 123 -x -x -y 123", { options: {
                '-x': {
                    handler: function(name, value) {
                        t.equal(name, 'x');
                        t.strictEqual(value, true);
                        calls += 1;
                    }
                },
                'y': {
                    argc: 1,
                    handler: function(name, value) {
                        t.equal(name, 'y');
                        t.equal(value, 123);
                        ycalls += 1;
                    }
                }
            }});
            t.equal(opts.x, 3);
            t.equal(calls, 3);
            t.done();
        },

        'should assemble specified usage': function(t) {
            var opts = getopt("node js", {
                name: 'PROG',
                version: '1.2.3',
                description: 'my mock program',
                usage: 'PROG [options] files...',
                options: {
                    'h': { usage: 'show help' },
                    'x': { argc: 1, usage: 'specify x coord' },
                    'why': { name: 'y', argc: 1, form: '--why Y, -y Y_COORD', usage: 'specify y coord' },
                    'z': { flag: [ '-z', 'zed', 'zee' ], argc: 2, usage: 'specify z coord' },
                },
                showHelp: true
            });
            t.equal(typeof opts._usage, 'string');
            t.contains(opts._usage, /PROG.*1\.2\.3.*my mock program/);
            t.contains(opts._usage, /usage: PROG \[options\] files\.\.\./);
            t.contains(opts._usage, /-h$\s*show help$/m);
            t.contains(opts._usage, /-x <arg>$\s*specify x coord$/m);
            t.contains(opts._usage, /^\s*--why Y, -y Y_COORD$\s*specify y coord$/m);
            t.contains(opts._usage, /-z, --zed, --zee <2 args>$\s*specify z coord$/m);
            t.contains(opts._usage, /-h, --help$\s*show .* help/m);
            t.done();
        },

        'should assemble default usage': function(t) {
            var opts = getopt("node js", {
                showHelp: true,
                options: {
                }
            });
            t.contains(opts._usage, 'usage:');
            t.contains(opts._usage, '--help');
            t.done();
        },
    },
};
