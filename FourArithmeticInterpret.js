
function Context(map) {
	this.map = map;
}

Context.prototype.getContext = function() {
	
	return this.map;
}

var context;

function AbstractExpression() {

}
AbstractExpression.prototype.interpret = function() {

}

function TerminalExpression(val) {
	this.val = val;
}

TerminalExpression.prototype = new AbstractExpression();
TerminalExpression.prototype.interpret = function(isRaw) {
	if (!isNaN(+this.val)) {
		return this.val;
	}
	
	var result = context.getContext()[this.val];
	if (!result) {
		throw new Error('');
		return;
	}
	return result;
}

function NonTerminalExpression(left,  right) {
	this.left = left;
	this.right = right;
}

NonTerminalExpression.prototype = new AbstractExpression();
NonTerminalExpression.prototype.interpret = function() {
}

function AddExpression(left, right) {
	NonTerminalExpression.call(this, left, right);
}

AddExpression.prototype = new NonTerminalExpression();
AddExpression.prototype.interpret = function() {
	return this.left.interpret() + this.right.interpret();
}

function SubExpression(left, right) {
	NonTerminalExpression.call(this, left, right);
}

SubExpression.prototype = new NonTerminalExpression();
SubExpression.prototype.interpret = function() {
	return this.left.interpret() - this.right.interpret();
}

function MulExpression(left, right) {
	NonTerminalExpression.call(this, left, right);
}

MulExpression.prototype = new NonTerminalExpression();
MulExpression.prototype.interpret = function() {
	return this.left.interpret() * this.right.interpret();
}

function DivExpression(left, right) {
	NonTerminalExpression.call(this, left, right);
}

DivExpression.prototype = new NonTerminalExpression();
DivExpression.prototype.interpret = function() {
	return this.left.interpret() / this.right.interpret();
}

function BracketExpression(val) {
	this.val = val;
}

BracketExpression.prototype = new NonTerminalExpression();
BracketExpression.prototype.interpret = function() {
	var val = this.val.replace(/^\((.+)\)$/, '$1');
	
	var parser = new Parser();
	var root = parser.parse(val);
	if (!root) {
		return;
	}
	return root.interpret();
}

function Interpreter(expression, contextEnv) {
	this.parser = new Parser();
	this.expression = expression;
	
	context = new Context(contextEnv);
	this.root = null;
}

Interpreter.prototype.run = function() {
	this.root = this.parser.parse(this.expression);
	if (!this.root) {
		return;
	}
	var result = this.interpret();
	console.log(result);
}

Interpreter.prototype.interpret = function() {
	return this.root.interpret();
}

function Parser() {
	
}
Parser.prototype.parse = function(expression) {
	var iterator = new Iterator(expression);
	var root = null;
	var i = 0;
	var len = expression.length;
	var next, left, right;
	var current;
	var tmp = '';
	var stack = [];
	var map = {
		'+': AddExpression,
		'-': SubExpression,
		'*': MulExpression,
		'/': DivExpression
	};
	while(iterator.hasNext()) {
		current = iterator.nextToken(/[^\s]/);
		if (current === false) {
			return root;
		}
		switch(current) {
			case '(': 
				tmp = '(';
				stack.push('(');
				while(iterator.hasNext()) {
					current = iterator.nextToken(/[^\s]/);
					if (current === false) {
						throw new Error('');
						return;
					}
					if (current === '(') {
						stack.push('(');
					}
					if (current === ')') {
						stack.pop();
						tmp += current;
						if (stack.length === 0) {
							break;
						} else {
							continue;
						}
					}
					tmp += current;
				}
				if (root === null) {
					root = new BracketExpression(tmp);
				} else {
					root.right = new BracketExpression(tmp);
				}
				break;
			case '+':
			case '-':
			case '*':
			case '/':
				left = root;
				if (left === null) {
					left = new TerminalExpression(0);
				}
				next = iterator.nextToken(/[^\s]/);
				if (next === false) {
					throw new Error('');
					return;
				}
				if (next === '(') {
					iterator.rollback();
					right = new TerminalExpression(null);
				} else if (/[0-9]/.test(next)){
					throw new Error('');
				} else {
					right = next;
					while(next = iterator.nextToken(/[^\s]/)) {
						if (/[a-zA-Z0-9]/.test(next)) {
							right += next;
						} else {
							iterator.rollback();
							break;
						}
					}
					right = new TerminalExpression(right);
				}
				if (   (current === '*' || current === '/') 
					&& (left instanceof AddExpression || left instanceof SubExpression)
				) {
					left.right = new map[current](left.right, right);
					root = left;
					break;
				}
				root = new map[current](left, right);
				break;
			default: 
				root = new TerminalExpression(current);
		}
		i++;
	}
	return root;
}

function Iterator(val) {
	this.val = val;
	this.postion = 0;
	this.length = val.length;
}
Iterator.prototype.next = function() {
	return this.val[this.postion++];
}

Iterator.prototype.hasNext = function() {
	return this.postion < this.length;
}

Iterator.prototype.rollback = function() {
	return this.postion--;
}

Iterator.prototype.nextToken = function(regexp) {
	while(this.hasNext()) {
		var current = this.next();
		if (regexp.test(current)) {
			return current;
		}
	}
	return false;
}
