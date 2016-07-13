/* globals before, describe, it */

var fs = require('fs');
var assert = require('assert');
var md = require('markdown-it');
var cheerio = require('cheerio');
var taskLists = require('..');

describe('markdown-it-task-lists', function() {
    var fixtures = {}, rendered = {}, $ = {}, parser;

    before(function() {
        var files = {
            bullet: 'bullet.md',
            ordered: 'ordered.md',
            mixedNested: 'mixed-nested.md',
            dirty: 'dirty.md'
        };

        parser = md().use(taskLists);

        for (var key in files) {
            fixtures[key] = fs.readFileSync(__dirname + '/fixtures/' + files[key]).toString();
            rendered[key] = parser.render(fixtures[key]);
            $[key] = cheerio.load(rendered[key]);
        }
    });

    it('renders tab-indented code differently than default markdown-it', function() {
        var parserDefault = md();
        var parserWithPlugin = md().use(taskLists);
        assert.notEqual(parserDefault.render(fixtures.bullet), parserWithPlugin.render(fixtures.bullet));
    });

    it('adds input.task-list-item-checkbox in items', function () {
        assert(~$.bullet('input.task-list-item-checkbox').length);
    });

    it('renders items marked up as [ ] as unchecked', function () {
        var shouldBeUnchecked = (fixtures.ordered.match(/[\.\*\+-]\s+\[ \]/g) || []).length;
        assert.equal(shouldBeUnchecked, $.ordered('input[type=checkbox].task-list-item-checkbox:not(:checked)').length);
    });

    it('renders items marked up as [x] as checked', function () {
        var shouldBeChecked = (fixtures.ordered.match(/[\.\*\+-]\s+\[[Xx]\]/g) || []).length;
        assert.equal(shouldBeChecked, $.ordered('input[type=checkbox].task-list-item-checkbox:checked').length);
    });

    it('disables the rendered checkboxes', function () {
        assert(!$.bullet('input[type=checkbox].task-list-item-checkbox:not([disabled])').length);
    });

    it('enables the rendered checkboxes when options.enabled is truthy', function () {
        var enabledParser = md().use(taskLists, {enabled: true});
        var $$ = cheerio.load(enabledParser.render(fixtures.ordered));
        assert($$('input[type=checkbox].task-list-item-checkbox:not([disabled])').length > 0);
    });

    it('does NOT render [  ], [ x], [x ], or [ x ] as checkboxes', function () {
        var html = $.dirty.html();
        assert(~html.indexOf('[  ]'));
        assert(~html.indexOf('[x ]'));
        assert(~html.indexOf('[ x]'));
        assert(~html.indexOf('[ x ]'));
    });

    it('adds class .task-list-item to parent <li>', function () {
        assert(~$.bullet('li.task-list-item').length);
    });

    it('adds class .task-list to lists', function () {
        assert(~$.bullet('ol.task-list, ul.task-list').length);
    });

    it('only adds .task-list to most immediate parent list', function () {
        assert($.mixedNested('ol:not(.task-list) ul.task-list').length);
    });
});
