import { AstNode } from "js-ast-parser/dist/lib/AstNode";
import { v4 as uuidv4 } from 'uuid';

export class BoundaryNode {
    nextBoundary: BoundaryNode;
    prevBoundary: BoundaryNode;
    prevNode: any;
    nextNode: any;
    id: string;
    constructor(
        public node?: AstNode,
        public body?: AstNode[]
    ) {
        this.id = uuidv4();
    }
}