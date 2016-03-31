// Markdown-it plugin to render GitHub-style task lists; see
//
// https://github.com/blog/1375-task-lists-in-gfm-issues-pulls-comments
// https://github.com/blog/1825-task-lists-in-all-markdown-documents

module.exports = function(md, options) {
	md.core.ruler.after('inline', 'github-task-lists', function(state) {
		var tokens = state.tokens;
		for (var i = 2; i < tokens.length; i++) {
			if (isTodoItem(tokens, i)) {
				todoify(tokens[i], state.Token);
				tokens[i-2].attrSet('class', 'task-list-item');
				tokens[parentToken(tokens, i-2)].attrSet('class', 'task-list');
			}
		}
	});
};

function parentToken(tokens, index) {
	var targetLevel = tokens[index].level - 1;
	for (var i = index - 1; i >= 0; i--) {
		if (tokens[i].level === targetLevel) {
			return i;
		}
	}
	return -1;
}

function isTodoItem(tokens, index) {
	return isInline(tokens[index]) &&
	       isParagraph(tokens[index - 1]) &&
	       isListItem(tokens[index - 2]) &&
	       startsWithTodoMarkdown(tokens[index]);
}

function todoify(token, TokenConstructor) {
	token.children.unshift(makeCheckbox(token, TokenConstructor));
	token.children[1].content = token.children[1].content.slice(3);
	token.content = token.content.slice(3);
}

function makeCheckbox(token, TokenConstructor) {
	var checkbox = new TokenConstructor('html_inline', '', 0);
	if (token.content.indexOf('[ ]') === 0) {
		checkbox.content = '<input class="task-list-item-checkbox" disabled="" type="checkbox">';
	} else if (token.content.indexOf('[x]') === 0 || token.content.indexOf('[X]') === 0) {
		checkbox.content = '<input class="task-list-item-checkbox" checked="" disabled="" type="checkbox">';
	}
	return checkbox;
}

function isInline(token) { return token.type === 'inline'; }
function isParagraph(token) { return token.type === 'paragraph_open'; }
function isListItem(token) { return token.type === 'list_item_open'; }

function startsWithTodoMarkdown(token) {
	// leading whitespace in a list item is already trimmed off by markdown-it
	return token.content.indexOf('[ ]') === 0 || token.content.indexOf('[x]') === 0 || token.content.indexOf('[X]') === 0;
}
