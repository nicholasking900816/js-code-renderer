import { Block } from "js-ast-parser/dist/Block";
import { NodeCode } from "js-ast-parser/dist/constants";
import { JavascriptAst } from "js-ast-parser/dist/JavascriptAst";
import { AstNode } from "js-ast-parser/dist/lib/AstNode";
import { ArrayLiteralExpression } from "js-ast-parser/dist/lib/expression/ArrayLiteralExpression";
import { AssignmentExpression } from "js-ast-parser/dist/lib/expression/AssignmentExpression";
import { BinaryExpression } from "js-ast-parser/dist/lib/expression/BinaryExpression";
import { CallExpression } from "js-ast-parser/dist/lib/expression/CallExpression";
import { FunctionExpression } from "js-ast-parser/dist/lib/expression/FuntionExpression";
import { IdentifierLiteralExpression } from "js-ast-parser/dist/lib/expression/IdentifierLiteralExpression";
import { MemberExpression } from "js-ast-parser/dist/lib/expression/MemberExpression";
import { NewExpressioin } from "js-ast-parser/dist/lib/expression/NewExpressioin";
import { NumberLiteralExpression } from "js-ast-parser/dist/lib/expression/NumberLiteratalExpression";
import { ObjectLiteralExpression } from "js-ast-parser/dist/lib/expression/ObjectLiteralExpression";
import { ParticularLiteralExpression } from "js-ast-parser/dist/lib/expression/ParticularLiteralExpression";
import { RegExpressioin } from "js-ast-parser/dist/lib/expression/RegExpressioin";
import { StringLiteralExpression } from "js-ast-parser/dist/lib/expression/StringLiteralExpression";
import { TemplateLiteralExppression } from "js-ast-parser/dist/lib/expression/TemplateLiteralExppression";
import { TernaryExpression } from "js-ast-parser/dist/lib/expression/TernaryExpression";
import { UnaryExpression } from "js-ast-parser/dist/lib/expression/UnaryExpression";
import { ClassDeclarationStatement } from "js-ast-parser/dist/lib/statement/ClassDeclarationStatement";
import { DoWhileStatement } from "js-ast-parser/dist/lib/statement/DoWhileStatement";
import { ExportDeclarationStatement } from "js-ast-parser/dist/lib/statement/ExportDeclarationStatement";
import { ForStatement } from "js-ast-parser/dist/lib/statement/ForStatement";
import { FunctionDeclarationStatement } from "js-ast-parser/dist/lib/statement/FunctionDeclarationStatement";
import { IfStatement } from "js-ast-parser/dist/lib/statement/IfStatement";
import { ImportStatement } from "js-ast-parser/dist/lib/statement/ImportStatement";
import { ReturnStatement } from "js-ast-parser/dist/lib/statement/ReturnStatement";
import { SwitchCaseStatement } from "js-ast-parser/dist/lib/statement/SwitchCaseStatement";
import { SwitchStatement } from "js-ast-parser/dist/lib/statement/SwitchStatement";
import { TryCathchStatement } from "js-ast-parser/dist/lib/statement/TryCatchStatement";
import { UnExpectStatement } from "js-ast-parser/dist/lib/statement/UnExpectStatement";
import { VariableDeclarationStatement } from "js-ast-parser/dist/lib/statement/VariableDeclarationStatement";
import { WhileStatement } from "js-ast-parser/dist/lib/statement/WhileStatement";
import { WithStatement } from "js-ast-parser/dist/lib/statement/WithStatement";
import { CodeRenderNode } from "./code-render-node";
import { Color, RegPosEscape, RegPosQulifier, RegQulifier, RegSpecilCharEscape } from "./constance";
import { LinkedListUtil } from "./linked-list.util";
import { BoundaryNode } from "./boundary-node";
import { Definition } from "js-ast-parser/dist/lib/scope-analyzer/Definition";
import { DefinitionType } from "js-ast-parser/dist/lib/scope-analyzer/definitionType";
import { TypeOfExpression } from "js-ast-parser/dist/lib/expression/TypeOfExpression";
import { ThrowStatement } from "js-ast-parser/dist/lib/statement/ThrowStatement";
import { BreakStatement } from "js-ast-parser/dist/lib/statement/BreakStatement";
import { DebuggerStatement } from "js-ast-parser/dist/lib/statement/DebuggerStatement"
import { ContinueStatement } from "js-ast-parser/dist/lib/statement/ContinueStatement";
import { VoidExpression } from "js-ast-parser/dist/lib/expression/VoidExpression";
import { BracketEnwrapedExpressioin } from "js-ast-parser/dist/lib/expression/BracketEnwrapedExpressioin";
import { Scope } from "js-ast-parser/dist/lib/scope-analyzer/Scope";
import { JavascriptAstParsser } from "js-ast-parser";

export class CodeRenderer {
    private pos: number = 0;
    private isBeautifyingUnExpect = false;
    private unexpectMsg: string | undefined;
    private renderingVar = false;
    private currentNode: any;
    private boundaryLinkedListUtil = new LinkedListUtil('prevBoundary', 'nextBoundary');
    private identifierLinkedListUtil = new LinkedListUtil('prevIdentifier', 'nextIdentifier');
    private nodeLinkedListUtil = new LinkedListUtil('prevNode', 'nextNode');
    private curIdentifier: CodeRenderNode;
    private curBoundary: BoundaryNode = new BoundaryNode();
    private curBlock: Block;
    private curScope: Function;
    private rowIndex = 1;
    private colIndex = 0;
    private ast: JavascriptAst

    constructor(private inputCode: string) {
        this.ast = new JavascriptAstParsser(inputCode).parse();
    }

    static ResultType = {
        linkedList: 'linkedList',
        arr: 'arr'
    }

    static stringify(headNode: CodeRenderNode, tailNode: CodeRenderNode) {
        let str = '';
        let curNode = headNode;
        while(curNode) {
            str += curNode.text.replace(/\&nbsp;/g, ' ');
            if (curNode.lineEnd) str += '\r\n';
            if (curNode.id === tailNode.id) break;
            curNode = curNode.nextNode;
        }
        return str;
    }

    render(resultType = 'arr', replaceBlock?: Block) {
        let block = this.ast.topLevelBlock;
        let currentBoundary = this.curBoundary = new BoundaryNode();
        let currentNode = this.currentNode = new CodeRenderNode('');
        let currentIdentifier = this.curIdentifier = currentNode;

        currentNode.identifier = true;
        currentNode.isHead = true;
        this.currentNode.boundary = this.curBoundary;
        this.curBoundary.nextNode = this.currentNode;
        this.curBlock = replaceBlock || block;
        this.curScope = function() {
            return (replaceBlock ? replaceBlock.scope : block.scope) || new Scope()
        };

        replaceBlock ? this.reRender(block.body, replaceBlock) : this.renderBlock(block);
        
        if (this.pos < this.inputCode.length || this.currentNode === currentNode) { // this.currentNode === currentNode ?????? this.inputCode === ''
            if (this.curBoundary === currentBoundary) {
                let leave = this.enter(undefined, replaceBlock || block);
                this.advanceTo(this.inputCode.length + 1);// ??????advanceTo this.inputCode.length + 1 ?????????this.inputCode.length ????????????inputCode???''??????????????????text???''???node
                leave();
            } else {
                this.advanceTo(this.inputCode.length + 1);
            }
        } 

        /**??????????????????????????????????????? */
        this.nodeLinkedListUtil.linkAfter(this.currentNode, currentNode);
        // this.nodeLinkedListUtil.unlinked(currentNode);

        /**??????????????????????????????????????? */
        this.boundaryLinkedListUtil.linkAfter(this.curBoundary, currentBoundary);
        currentBoundary.nextNode = currentNode;
        currentBoundary.prevNode = currentNode.prevNode;
        currentNode.boundary = currentBoundary;
        
        /**??????????????????????????????????????? */
        this.identifierLinkedListUtil.linkAfter(this.curIdentifier, currentIdentifier);

        if (resultType === CodeRenderer.ResultType.linkedList) return currentNode

        const arr = [];
        let lineIndex = 0;
        this.nodeLinkedListUtil.forEach(currentNode, node => {
            const line = arr[lineIndex] || (arr[lineIndex]  = []);
            line.push(node);
            if (node.lineEnd) lineIndex ++;
        });
        return arr;
    }

    reRender(nodes, replaceBlock) {
        let prevBlock = this.curBlock, prevScope = this.curScope;
        this.curBlock = replaceBlock;
        this.curScope = function() {
            return replaceBlock.scope || new Scope()
        };

        this.renderNodes(nodes, true);
        this.curBlock = prevBlock;
        this.curScope = prevScope; 
    }

    private renderBlock(block: Block) {
        if (!block || !block.body.length) return;
        let prevBlock = this.curBlock, prevScope = this.curScope;
        this.curBlock = block;
        this.curScope = function() {
            return block.scope || new Scope()
        };

        this.renderNodes(block.body, true);
        this.curBlock = prevBlock;
        this.curScope = prevScope; 
    }

    private pushNode(node: CodeRenderNode) {
        this.nodeLinkedListUtil.insertAfter(this.currentNode, node);
        this.currentNode = node;
        node.boundary = this.curBoundary;
        node.block = this.curBlock;
        node.scope = this.curScope;
        this.colIndex += node.text.length;
    }

    private enter(node: AstNode | undefined, body: any) {
        let boundary = new BoundaryNode(node, body)
        this.boundaryLinkedListUtil.linkAfter(this.curBoundary, boundary);
        this.nodeLinkedListUtil.linkAfter(this.currentNode, boundary);
        this.curBoundary = this.currentNode = boundary; 
        return () => {
            this.nodeLinkedListUtil.separate(boundary)
        }
    }

    private renderNodes(nodes: Array<AstNode | undefined>, boundary = false, checkScope = true) {
        nodes.forEach((node) => {
            if (!node) return;
            if (node instanceof Block) {
                return this.renderBlock(node as Block);
            }
            let separate;
            this.advanceTo(node.loc.start as number);
            if (boundary) {
                separate = this.enter(node, nodes);
            }
            
            switch (node.code) {
                case NodeCode.MemberExpression:
                    this.renderMemberExpression(node as MemberExpression);
                    break;
                case NodeCode.ArrayLiteralExpression:
                    this.renderArrayLiteral(node as ArrayLiteralExpression);
                    break;
                case NodeCode.AssignmentExpression:
                    this.renderAssignExpression(node as AssignmentExpression);
                    break;
                case NodeCode.SwitchCaseStatement:
                    this.renderSwitchCase(node as SwitchCaseStatement);
                    break;
                case NodeCode.ClassDeclarationStatement:
                    this.renderClassDeclaratioin(node as ClassDeclarationStatement);
                    break;
                case NodeCode.BinaryExpression:
                    this.renderBinary(node as BinaryExpression);
                    break;
                case NodeCode.IfStatement:
                    this.renderIf(node as IfStatement);
                    break;
                case NodeCode.DoWhileStatement:
                    this.renderDoWhile(node as DoWhileStatement);
                    break;
                case NodeCode.ExportDeclarationStatement:
                    this.renderExport(node as ExportDeclarationStatement);
                    break;
                case NodeCode.ForStatement:
                    this.renderForStatement(node as ForStatement);
                    break;
                case NodeCode.CallExpression:
                    this.renderCall(node as CallExpression);
                    break;
                case NodeCode.FunctionDeclarationStatement:
                case NodeCode.FunctionExpression:
                    this.renderFunctionDeclaration(node as FunctionDeclarationStatement);
                    break;
                case NodeCode.IdentifierLiteralExpression:
                    this.renderIdentifier(node as IdentifierLiteralExpression, undefined, false, checkScope);
                    break;
                case NodeCode.ImportStatement:
                    this.renderImport(node as ImportStatement);
                    break;
                case NodeCode.NewExpression:
                    this.renderNewExpression(node as NewExpressioin);
                    break;
                case NodeCode.NumberLiteralExpression:
                    this.renderNumber(node as NumberLiteralExpression);
                    break;
                case NodeCode.ObjectLiteralExpression:
                    this.renderObject(node as ObjectLiteralExpression);
                    break;
                case NodeCode.StringLiteralExpression:
                    this.renderString(node as StringLiteralExpression);
                    break;
                case NodeCode.SwitchStatement:
                    this.renderSwitch(node as SwitchStatement);
                    break;
                case NodeCode.TemplateLiteralExpression:
                    this.renderTemplate(node as TemplateLiteralExppression);
                    break;
                case NodeCode.TernaryExpression:
                    this.renderTernary(node as TernaryExpression);
                    break;
                case NodeCode.TryCathchStatement:
                    this.renderTryCatch(node as TryCathchStatement);
                    break;
                case NodeCode.UnaryExpression:
                    this.renderNodes([(<UnaryExpression>node).argument]) 
                    break;
                case NodeCode.VariableDeclarationStatement:
                    this.renderVariableDelaration(node as VariableDeclarationStatement);
                    break;
                case NodeCode.WhileStatement:
                    this.renderWhileStatement(node as WhileStatement);
                    break;
                case NodeCode.WithStatement:
                    this.renderWithStatement(node as WithStatement);
                    break;
                case NodeCode.RegExpression:
                    this.renderReg(node as RegExpressioin);
                    break;    
                case NodeCode.UnexpectStatement:
                    this.renderUnexpects(node as UnExpectStatement);
                    break;
                case NodeCode.ReturnStatement:
                    this.renderReturnStatement(node as ReturnStatement);
                    break;
                case NodeCode.ThrowStatement:
                    this.renderThrowStatement(node as ThrowStatement);
                    break;    
                case NodeCode.ParticularLiteralExpression:
                    this.renderParticularLiteralExpression(node as ParticularLiteralExpression);
                    break;  
                case NodeCode.TypeOfExpression:
                    this.renderTypeOfExpression(node as TypeOfExpression);
                    break;
                case NodeCode.VoidExpression:
                    this.renderVoidExpression(node as VoidExpression);
                    break;    
                case NodeCode.BreakStatement:
                    this.renderBreakStatement(node as BreakStatement);
                    break;
                case NodeCode.DebuggerStatement:
                    this.renderDebugger(node as DebuggerStatement);
                    break;    
                case NodeCode.BracketEnwrapedExpressioin:
                    this.renderBracketEnwraped(node as BracketEnwrapedExpressioin);
                    break;    
                case NodeCode.ContinueStatement:
                    this.renderContinueStatement(node as ContinueStatement);
                    break;

            }
            this.renderNodes((<AstNode>node).unexpectedNodes);
            this.advanceTo(node.loc.end as any);
            if(separate) separate();
        })
    }

    private renderDebugger(statement: DebuggerStatement) {
        this.advanceTo(statement.loc.start);
        this.advanceTo(statement.loc.end, 'debugger', Color.declarationKeyWord);
    }
    

    private renderTypeOfExpression(expression: TypeOfExpression) {
        this.advanceTo(expression.loc.start as number);
        this.advanceTo(this.pos + 6, 'typeof', Color.declarationKeyWord);
        this.renderNodes([expression.argument]);
    }

    private renderVoidExpression(expression: VoidExpression) {
        this.advanceTo(expression.loc.start as any + 4, 'void', Color.declarationKeyWord);
        this.renderNodes([expression.argument]);
    }

    private renderParticularLiteralExpression(expression: ParticularLiteralExpression) {
        this.advanceTo(expression.loc.start as any);
        this.pushNode(new CodeRenderNode(expression.raw, {color: Color.declarationKeyWord}))
        this.pos = expression.loc.end as number;
    }

    private renderThrowStatement(statement: ThrowStatement) {
        this.advanceTo(statement.loc.start + 5, 'throw', Color.keyWord);
        this.renderNodes([statement.argument]);
    }

    private renderReturnStatement(statement: ReturnStatement) {
        this.advanceTo(statement.loc.start + 6, 'return', Color.keyWord);
        this.renderNodes([statement.argument]);
    }

    private renderBracketEnwraped(expression: BracketEnwrapedExpressioin) {
        this.renderNodes([expression.expression])
    }

    private renderBreakStatement(statement: BreakStatement) {
        this.advanceTo(statement.loc.start + 5, 'break', Color.keyWord);
        this.renderNodes([statement.argument]);
    }

    private renderContinueStatement(statement: ContinueStatement) {
        this.advanceTo(statement.loc.start + 8, 'continue', Color.keyWord);
        this.renderNodes([statement.argument]);
    }

    private renderUnexpects(statement: UnExpectStatement) {
        if (!statement.value) return;
        let prevIsBeautifyingUnexpect = this.isBeautifyingUnExpect, prevMsg = this.unexpectMsg;
        this.isBeautifyingUnExpect = true;
        this.unexpectMsg = statement.msg;
        if (statement.value instanceof AstNode) {
            this.renderNodes([statement.value]);
            this.advanceTo(statement.loc.end);
        } else {
            this.advanceTo(statement.loc.start);
            this.pushNode(new CodeRenderNode(statement.value, { color: Color.normal }, true, false, statement.msg));
            this.pos = statement.loc.end;
        }
        this.isBeautifyingUnExpect = prevIsBeautifyingUnexpect;
        this.unexpectMsg = prevMsg;
    }

    private renderReg(statement: RegExpressioin) {
        this.advanceTo(statement.loc.start);
        let pattern = statement.pattern;
        if (!pattern) return;
        this.pushNode(new CodeRenderNode('/', {color: Color.RegChar}));
        let index = 1, startIndex = 1, len = pattern.length;
    
        let consumeRange = () => {
            this.pushNode(new CodeRenderNode('[', {color: Color.RegEnwrap}));
            startIndex = ++index;
            while(index < len) {
                let curCharCode = pattern.charCodeAt(index);
                if (curCharCode === 93) {
                    pushCommentChar();
                    this.pushNode(new CodeRenderNode(']', {color: Color.RegEnwrap}));
                    startIndex = ++index;
                    break;
                }
                if (curCharCode === 92) {
                    pushCommentChar();
                    consumeEscapeChar();
                } else {
                    index++
                }
            }
        }
    
        let pushCommentChar = () => {
            let text = pattern.slice(startIndex, index);
            text && this.pushNode(new CodeRenderNode(text, {color: Color.RegChar}));
            startIndex = index;
        }
    
        let consumeEscapeChar = () => {
            let nextChar = pattern.charAt(index + 1), color, unicode;
            if (nextChar === 'u' && /\\u[a-fA-F0-9]{4}/.test(unicode = pattern.slice(index,index + 6))) {
                this.pushNode(new CodeRenderNode(unicode, {color: Color.declarationKeyWord}));
                index = startIndex = index + 6;
                return;
            } 
            if (RegSpecilCharEscape.indexOf(nextChar) > -1){
                color = Color.RegChar;
            } else if (RegPosEscape.indexOf(nextChar) > -1) {
                color = Color.RegPosQulifier;
            } else {
                color = Color.RegEscapeChar;
            }
            this.pushNode(new CodeRenderNode(pattern.slice(index, startIndex = index + 2), {color: color}))
            index = startIndex;
        }
    
        let tryConsumeBrace = () => {
            let childPattern = pattern.slice(index);
            let braceCloseIndex = childPattern.indexOf('}');
            if (braceCloseIndex < 0) return false;
            let bracePattern = childPattern.slice(0, braceCloseIndex + 1);
            if (/{[0-9]+,?[0-9]*}/.test(bracePattern)) {
                this.pushNode(new CodeRenderNode(bracePattern, {color: Color.RegBrace}));
                index = startIndex = index + bracePattern.length;
                return true;
            }
        }
    
        while(len > index) {
            let curCharCode = pattern.charCodeAt(index), curChar = pattern.charAt(index);
            if(curCharCode === 92) {
                pushCommentChar();
                consumeEscapeChar();
            } else if (curCharCode === 91) {
                pushCommentChar();
                consumeRange();
            } else if (curCharCode === 123) {
                pushCommentChar();
                tryConsumeBrace();
            } else if (curCharCode === 40 || curCharCode === 41) {// '(' || ')'
                pushCommentChar();
                this.pushNode(new CodeRenderNode(curChar, {color: Color.RegEnwrap}))
                if (curCharCode === 40) {
                    let peekNextTwo = pattern.slice(index + 1, index + 3);
                    if (peekNextTwo === '?:') {
                        this.pushNode(new CodeRenderNode(peekNextTwo, {color: Color.RegEnwrap}))
                        index += 2;
                    } 
                }
                startIndex = ++index;
            } else if (RegQulifier.indexOf(curChar) > -1) {
                pushCommentChar();
                this.pushNode(new CodeRenderNode(curChar, {color: Color.RegQualifier}));
                startIndex = ++index;
            } else if (RegPosQulifier.indexOf(curChar) > -1) {
                pushCommentChar();
                this.pushNode(new CodeRenderNode(curChar, {color: Color.RegPosQulifier}));
                startIndex = ++index;
            } else {
                index ++;
            }
        } 
        pushCommentChar();
        if (statement.flag) {
            this.pushNode(new CodeRenderNode(statement.flag, {color:Color.declarationKeyWord}))
        }
        this.pos = statement.loc.end;

    }

    private renderWithStatement(statement: WithStatement) {
        this.advanceTo(statement.loc.start + 4, 'with', Color.keyWord);
        this.renderNodes([statement.context]);
        this.renderBlock(statement.body);
    }

    private renderTryCatch(statement: TryCathchStatement) {
        this.advanceTo(statement.loc.start + 3, 'try', Color.keyWord);
        this.renderBlock(statement.body);
        if (statement.catchHandler) {
            let catchHandler: FunctionDeclarationStatement = statement.catchHandler;
            this.advanceTo(catchHandler.loc.start + 5, 'catch', Color.keyWord);
            catchHandler.params.forEach(iden => this.advanceTo(iden.loc.start + iden.identifier.length, iden.identifier, Color.identifier));
            this.renderBlock(catchHandler.body);
        }
        if (statement.finalizer) {
            if (statement.finalizer.body[0]) {
                this.advanceTo(statement.finalizer.loc.start, 'finally', Color.keyWord);
                this.renderBlock(statement.finalizer);
            } else {
                this.advanceTo(statement.loc.end, 'finally', Color.keyWord)
            }
        }
    }

    private renderWhileStatement(statement: WhileStatement) {
        this.advanceTo(statement.loc.start + 5, 'while', Color.keyWord);
        this.renderNodes([statement.test]);
        this.renderBlock(statement.consequence);
    }

    private renderTernary(expression: TernaryExpression) {
        this.renderNodes([expression.test, expression.consequent, expression.alternate]);
    }
    

    private renderTemplate(expression: TemplateLiteralExppression) {
        this.advanceTo(expression.loc.start);
        if (expression.content.length) {
            this.advanceTo(expression.content[0].loc.start, undefined, Color.str)
            this.renderNodes(expression.content);
        }   
        if (!expression.unexpectedNodes.length) {
            this.advanceTo(expression.loc.end, undefined, Color.str)
        }
    }
    
    private renderSwitch(expression: SwitchStatement) {
        this.safeAdvanceToNextStart(expression.discriminant, expression, 'switch', Color.keyWord);
        this.renderNodes([expression.discriminant]);
        expression.cases.forEach((item: SwitchCaseStatement) => this.renderSwitchCase(item))
    }

    private renderObject(expression: ObjectLiteralExpression) {
        expression.properties.forEach(item => {
            this.renderNodes([item.key], false, false);
            this.renderNodes([item.value]);
        })
    }

    private renderNumber(expression: NumberLiteralExpression) {
        this.advanceTo(expression.loc.start);
        this.pushNode(new CodeRenderNode(expression.value, {color: Color.num}, this.isBeautifyingUnExpect, false, this.unexpectMsg));
        this.pos = expression.loc.end;
    }

    private renderNewExpression(expression: NewExpressioin) {
        this.safeAdvanceToNextStart(expression.callee, expression, 'new', Color.declarationKeyWord);
        this.renderNodes([expression.callee]);
    }

    private renderImport(statement: ImportStatement) {
        if (statement.imported) {
            this.advanceTo(statement.imported.loc.start, 'import', Color.keyWord);
            this.renderIdentifier(statement.imported, undefined, false, false);
            statement.local && this.renderIdentifier(statement.local, undefined, false, false);
        } else if (statement.specifiers && statement.specifiers.length) {
            this.advanceTo(statement.specifiers[0].imported.loc.start, 'import', Color.keyWord);
            statement.specifiers.forEach(sepecifier => {
                this.renderIdentifier(sepecifier.imported, undefined, false, false);
                sepecifier.local && this.renderIdentifier(sepecifier.local, undefined, false, false);
            })
        }

        if (statement.from) {
            this.advanceTo(statement.from.loc.start, 'from', Color.keyWord)
            this.renderString(statement.from)
        }
    }

    private renderCall(expression: CallExpression) {
        this.renderCallee(expression.callee);
        this.renderNodes(expression.arguments);
    }

    private renderCallee(callee: AstNode) {
        if (callee.code === NodeCode.IdentifierLiteralExpression) {
            let definition = this.curScope().getDefinition((<IdentifierLiteralExpression>callee).identifier);
            this.renderIdentifier(
                callee as IdentifierLiteralExpression, 
                definition && definition.definitionType === DefinitionType.CLASS ? Color.classIdentifier : Color.funIdentifier
            )
        } else if (callee.code === NodeCode.MemberExpression) {
            this.renderMemberExpression(callee as MemberExpression, true);
        } else {
            this.renderNodes([callee]);
        }
    }

    private renderForStatement(statement: ForStatement) {
        this.advanceTo(statement.loc.start + 3, 'for', Color.keyWord);
        let prevScope = this.curScope;
        if(statement.body && statement.body.scope) {
            this.curScope = function() {
                return statement.body?.scope?.parent || new Scope()
            };
        }
        if (statement.forIn || statement.forOf) {
            this.renderNodes([statement.left]);
            this.advanceTo(statement.right.loc.start, '((of)|(in))', Color.declarationKeyWord);
            this.renderNodes([statement.right]);
        }
        let update = statement.update || [];
        this.renderNodes([statement.init, statement.test, ...update])
    
        this.renderBlock(statement.body);
        this.curScope = prevScope;
    }

    private renderVariableDelaration(statement: VariableDeclarationStatement) {
        this.renderingVar = true;
        this.advanceTo(
            statement.loc.start + statement.declarationKeyWord.length, 
            statement.declarationKeyWord, 
            Color.declarationKeyWord
        );
        this.renderNodes(statement.declarations);
        this.renderingVar = false;
    }
    
    private renderExport(statement: ExportDeclarationStatement) {
        if (statement.declaration) {
            this.advanceTo(statement.declaration.loc.start, 'export', Color.keyWord);
            this.renderVariableDelaration(statement.declaration);
        } else if (statement.exported) {
            this.advanceTo(statement.exported.loc.start, 'export', Color.keyWord);
            this.renderNodes([statement.exported]);
            statement.local && this.renderNodes([statement.local]);
        } else if (statement.specifiers) {
            this.advanceTo(statement.specifiers[0].exported.loc.start, 'export', Color.keyWord);
            statement.specifiers.forEach(specifier => {
                this.renderNodes([specifier.exported]);
                specifier.local && this.renderNodes([specifier.local]);
            })
        }

        if (statement.from) {
            this.renderString(statement.from);
        }
    }

    private renderString(expression: StringLiteralExpression) {
        if(!expression) return;
        this.advanceTo(expression.loc.start);
        this.consumeTo(expression.loc.end, Color.str);
        // str = this.inputCode.slice(expression.loc.start, expression.loc.end);
        // if (!str) return;
        // strFragments = str.split('\r\n')// ???????????????????????????
        // this.pushNode(new CodeRenderNode(this.inputCode.slice(expression.loc.start, expression.loc.end), { color: Color.str }, this.isBeautifyingUnExpect, false, this.unexpectMsg));
        // this.pos = expression.loc.end;
    }

    private renderDoWhile(statement: DoWhileStatement) {
        this.advanceTo(statement.loc.start + 2, 'do', Color.keyWord)
        this.renderBlock(statement.body);
        if (statement.test) {
            this.advanceTo(statement.test.loc.start, 'while', Color.keyWord);
        }
        this.renderNodes([statement.test]);
    }

    private renderIf(statement: IfStatement) {
        this.safeAdvanceToNextStart(statement.test, statement, 'if', Color.keyWord);
        this.renderNodes([statement.test]);
        this.renderBlock(statement.consequent); 

        let alternate = statement.alternate;
        while(alternate) {
            if ((<AstNode>alternate).code === NodeCode.IfStatement) {
                this.safeAdvanceToNextStart((<IfStatement>alternate).test, alternate as IfStatement, 'else\\s+if', Color.keyWord);
                this.renderNodes([(<IfStatement>alternate).test]);
                this.renderBlock((<IfStatement>alternate).consequent);
            } else {
                if ((<any>alternate).body.length) {
                    this.advanceTo(alternate.loc.start, 'else', Color.keyWord);
                    this.renderBlock(alternate as Block);
                } else {
                    this.advanceTo(statement.loc.end, 'else', Color.keyWord);
                }
            }
            alternate = (<IfStatement>alternate).alternate
        }
    }

    private renderBinary(expression: BinaryExpression) {
        if (expression.operator === 'instanceof' || expression.operator === 'in') {
            this.renderNodes([expression.left]);
            this.advanceTo(expression.right.loc.start, expression.operator, Color.declarationKeyWord);
            this.renderNodes([expression.right]);
        } else {
            this.renderNodes([expression.left, expression.right]);
        }
    }

    private renderClassDeclaratioin(statement: ClassDeclarationStatement) {
        this.advanceTo(statement.loc.start + 5, 'class', Color.declarationKeyWord)
        this.renderIdentifier(statement.className, Color.classIdentifier, false);
        if (statement.super) {
            this.advanceTo(statement.super.loc.start, 'extends', Color.declarationKeyWord);
            this.renderIdentifier(statement.super, Color.classIdentifier);
        }
        statement.methods.forEach((fn: FunctionDeclarationStatement) => this.renderMethod(fn));
    }

    private renderMethod(method: FunctionDeclarationStatement) {
        if (method.identifier.identifier === 'constructor') {
            this.renderIdentifier(method.identifier, Color.declarationKeyWord, false, false);
        } else {
            this.renderIdentifier(method.identifier, Color.funIdentifier, false, false)
        }
        this.renderNodes(method.params);
        this.renderBlock(method.body);
    }

    private renderFunctionDeclaration(node: FunctionDeclarationStatement | FunctionExpression) {
        this.advanceTo(node.loc.start + 8, 'function', Color.declarationKeyWord)
        if ((<FunctionDeclarationStatement>node).identifier) {
            this.renderIdentifier((<FunctionDeclarationStatement>node).identifier, Color.funIdentifier, false);
        }

        let prevScope = this.curScope;
        this.curScope = function() {
            return node.body?.scope?.parent || new Scope()
        };
        this.renderNodes(node.params, false, true);
        this.renderBlock(node.body);
        this.curScope = prevScope;
    }
    

    private renderIdentifier(expression: IdentifierLiteralExpression, color?: string, declaration = false, checkScope = true) {
        if (!expression) return;
        this.advanceTo(expression.loc.start);
        let definition: Definition;
        if (!color && (definition = this.curScope().getDefinition(expression.identifier))) {
            if (definition.definitionType === DefinitionType.CONST) {
                color = Color.const;
            } else if (definition.type === DefinitionType.FUNCTION) {
                color = Color.funIdentifier;
            } else if (definition.type === DefinitionType.CLASS) {
                color = Color.classIdentifier;
            }
        }
        
        let node = new CodeRenderNode(expression.identifier, color ? { color: color } : { color: Color.identifier }, this.isBeautifyingUnExpect, false, this.unexpectMsg);
        node.checkScope = checkScope;
        node.identifier = true;
        node.declaration = declaration;

        this.identifierLinkedListUtil.linkAfter(this.curIdentifier, node)
        this.curIdentifier = node;
        this.pushNode(node);
        this.pos += expression.identifier.length;
    }

    static checkScope(node: CodeRenderNode) {
        if (node.scope) {
            let scope = node.scope;
            let definition = scope().getDefinition(node.text);
            if (!node.err && !node.warn && !node.declaration) {
                if (!definition) {
                    node.notDecalredErr = true
                    node.err = true;
                    node.msg = `?????? '${node.text}' ????????????`;
                } 
            }
            if (definition) {
                node.unuse = scope().isUnuse(definition);
                if(node.notDecalredErr) {
                    node.notDecalredErr = node.err = false;
                    node.msg = undefined;
                }
            }
        }
    }

    private renderSwitchCase(statement: SwitchCaseStatement) {
        if (statement.isDefault) {
            if (statement.consequent.body.length) {
                this.advanceTo(statement.consequent.loc.start, 'default', Color.keyWord);
                this.renderBlock(statement.consequent)
            } else {
                this.advanceTo(statement.loc.end, 'default', Color.keyWord);
            }
        } else {
            this.safeAdvanceToNextStart(statement.test, statement, 'case', Color.keyWord);
            this.renderNodes([statement.test]);
            this.renderBlock(statement.consequent);
        }
    }

    private renderAssignExpression(expression: AssignmentExpression) {
        this.advanceTo(expression.loc.start);
        if (this.renderingVar) {
            this.renderNodes([expression.left], false);
            this.renderingVar = false;
            this.renderNodes([expression.right]);
            this.renderingVar = true;
        } else {
            this.renderNodes([expression.left, expression.right]);
        }
    }

    private renderArrayLiteral(expression: ArrayLiteralExpression) {
        this.advanceTo(expression.loc.start);
        this.renderNodes(expression.items);
    }

    private renderMemberExpression(expression: MemberExpression, isCallee = false) {
        this.advanceTo(expression.loc.start);
        if (expression.property && expression.property.code === NodeCode.IdentifierLiteralExpression) {
            if ( expression.owner?.code === NodeCode.IdentifierLiteralExpression && (expression.owner as any).identifier === 'this') {
                this.renderIdentifier(expression.owner as IdentifierLiteralExpression, Color.declarationKeyWord, false, false)
            } else {
                this.renderNodes(
                    [expression.owner]            
                );
            }
            
            this.renderIdentifier(expression.property as IdentifierLiteralExpression, isCallee ? Color.funIdentifier : Color.identifier, false, expression.isComputed)
        } else { // property ???string
            this.renderNodes([expression.owner, expression.property]);
        }
    }

    private advanceTo(newPos: number, match?: string | RegExp, color?: string) {
        if (typeof newPos !== 'number') return
        if (this.pos === newPos) return;
        let text = this.inputCode.slice(this.pos, newPos);
        let regExp = match ? new RegExp(`(\\/\\/)|(\\/\\*)|(\\b${match}\\b)`) : /(\/\/)|(\/\*)/, matchResult;
        let matchStrReg = match ? new RegExp(`\\b${match}\\b`) : null; 
        while(matchResult = regExp.exec(text)) {
            this.consumeTo(this.pos + matchResult.index);
            text = text.slice(matchResult.index);
            if (matchResult[0] === '//') {
                let commentEndResult = /\n/.exec(text);
                this.consumeTo(commentEndResult ? this.pos + commentEndResult.index : newPos, Color.comment)
            } else if (matchResult[0] === '/*') {
                let commentEndResult = /\*\//.exec(text);
                if (commentEndResult) {
                    this.consumeTo(this.pos + commentEndResult.index + 2, Color.comment)
                }
            } else if (matchStrReg && matchStrReg.test(matchResult[0])) {
                this.consumeTo(this.pos + matchResult[0].length, color);
            }
            text = this.inputCode.slice(this.pos, newPos);
        }
        this.consumeTo(newPos);
    }

    private replaceWhileSpace(str: string) {
        return str.replace(/\s/g, '&nbsp;')
    }

    private consumeTo(newPos: number, color?: string) {
        if (newPos === this.pos) return;
        let text = this.inputCode.slice(this.pos, newPos);
        let textFragment: string[] = text.split('\n');
        if (!textFragment.length) return;
        this.pushNode(
            new CodeRenderNode(textFragment.shift() || '', color ? {color: color} : {}, this.isBeautifyingUnExpect, false, this.unexpectMsg)
        );
        textFragment.forEach((fragment, index) => {
            this.currentNode.lineEnd = true;
            this.rowIndex ++;
            this.colIndex = 0;
            if (!fragment.length && index === textFragment.length - 1 && newPos < this.inputCode.length) return //????????????????????????????????????????????????node,????????????????????????
            this.pushNode(
                new CodeRenderNode(
                    fragment, 
                    color ? {color: color} : {}, 
                    this.isBeautifyingUnExpect, 
                    false, 
                    this.unexpectMsg, 
                    this.rowIndex, this.colIndex
                )
            )    
        })
        this.pos = newPos;
    }

    private safeAdvanceToNextStart(node: AstNode, parent: AstNode, match?: string | RegExp, color?: string) {
        if(node) {
            this.advanceTo(node.loc.start, match, color)
        } else if (parent.unexpectedNodes.length) {
            this.advanceTo(parent.unexpectedNodes[0].loc.start, match, color);
        } else {
            this.advanceTo(this.inputCode.length, match, color);
        }
    } 
}