%{
/*
 * Copyright 2010       Chris Heunen
 * Copyright 2010-2013  Aleks Kissinger
 * Copyright 2013       K. Johan Paulsson
 * Copyright 2013       Alex Merry <dev@randomguy3.me.uk>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; either version 2 of
 * the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

#include "tikzparserdefs.h"
%}

/* we use features added to bison 2.4 */
%require "2.3"

%error-verbose
/* enable maintaining locations for better error messages */
%locations
/* the name of the header file */
/*%defines "common/tikzparser.h"*/
/* make it re-entrant (no global variables) */
%pure-parser
/* We use a pure (re-entrant) lexer.  This means yylex
   will take a void* (opaque) type to maintain its state */
%lex-param {void *scanner}
/* Since this parser is also pure, yyparse needs to take
   that lexer state as an argument */
%parse-param {void *scanner}

/* possible data types for semantic values */
%union {
    QString qstr;
    GraphElementProperty *prop;
    GraphElementData *data;
    Node *node;
    QPointF pt;
	struct noderef noderef;
}

%{
#include "node.h"
#include "edge.h"
#include "graphelementdata.h"
#include "graphelementproperty.h"

#include "tikzlexer.h"
#import "tikzgraphassembler.h"
/* the assembler (used by this parser) is stored in the lexer
   state as "extra" data */
#define assembler yyget_extra(scanner)

/* pass errors off to the assembler */
void yyerror(YYLTYPE *yylloc, void *scanner, const char *str) {
	// TODO: implement reportError()
	//assembler->reportError(str, yylloc);
}
%}

/* yyloc is set up with first_column = last_column = 1 by default;
   however, it makes more sense to think of us being "before the
   start of the line" before we parse anything */
%initial-action {
	yylloc.first_column = yylloc.last_column = 0;
}


%token BEGIN_TIKZPICTURE_CMD "\\begin{tikzpicture}"
%token END_TIKZPICTURE_CMD "\\end{tikzpicture}"
%token BEGIN_PGFONLAYER_CMD "\\begin{pgfonlayer}"
%token END_PGFONLAYER_CMD "\\end{pgfonlayer}"
%token DRAW_CMD "\\draw"
%token NODE_CMD "\\node"
%token PATH_CMD "\\path"
%token RECTANGLE "rectangle"
%token NODE "node"
%token AT "at"
%token TO "to"
%token SEMICOLON ";"
%token COMMA ","

%token LEFTPARENTHESIS "("
%token RIGHTPARENTHESIS ")"
%token LEFTBRACKET "["
%token RIGHTBRACKET "]"
%token FULLSTOP "."
%token EQUALS "="
%token <pt> COORD "co-ordinate"
%token <qstr> PROPSTRING "key/value string"
%token <qstr> REFSTRING "string"
%token <qstr> DELIMITEDSTRING "{-delimited string"

%token UNKNOWN_BEGIN_CMD "unknown \\begin command"
%token UNKNOWN_END_CMD "unknown \\end command"
%token UNKNOWN_CMD "unknown latex command"
%token UNKNOWN_STR "unknown string"
%token UNCLOSED_DELIM_STR "unclosed {-delimited string"

%type<qstr>   nodename
%type<qstr>   optanchor
%type<qstr>   val
%type<prop>    property
%type<data>    extraproperties
%type<data>    properties
%type<data>    optproperties
%type<node>    optedgenode
%type<noderef> noderef
%type<noderef> optnoderef

%%

tikzpicture: "\\begin{tikzpicture}" optproperties tikzcmds "\\end{tikzpicture}"
	{
		if ($2) {
			assembler->graph()->setData($2);
		}
	};
tikzcmds: tikzcmds tikzcmd | ;
tikzcmd: node | edge | boundingbox | ignore;

ignore: "\\begin{pgfonlayer}" DELIMITEDSTRING | "\\end{pgfonlayer}";

optproperties:
	"[" "]"
	{ $$ = 0; }
	| "[" properties "]"
	{ $$ = $2; }
	| { $$ = 0; };
properties: extraproperties property
	{
        $1 << $2;
		$$ = $1;
	};
extraproperties:
	extraproperties property ","
	{
        $1 << $2;
		$$ = $1;
	}
    | { $$ = GraphElementData(); };
property:
	val "=" val
    { $$ = GraphElementProperty($1,$3); }
	| val
    { $$ = GraphElementProperty($1); };
val: PROPSTRING { $$ = $1; } | DELIMITEDSTRING { $$ = $1; };

nodename: "(" REFSTRING ")" { $$ = $2; };
node: "\\node" optproperties nodename "at" COORD DELIMITEDSTRING ";"
	{
		Node *node = assembler->graph()->addNode();
		if ($2)
			node->setData($2);
		node->setName($3);
		node->setPoint($5);
		node->setLabel($6);
		assembler->addNodeToMap(node);
	};

optanchor:  { $$ = 0; } | "." REFSTRING { $$ = $2; };
noderef: "(" REFSTRING optanchor ")"
	{
		$$.node = assembler->nodeWithName($2);
		$$.anchor = $3;
	};
optnoderef:
	noderef { $$ = $1; }
	| "(" ")" { $$.node = 0; $$.anchor = 0; }
optedgenode:
	{ $$ = 0; }
	| "node" optproperties DELIMITEDSTRING
	{
		// TODO: implement edge-nodes
		// $$ = [Node node];
		// if ($2)
		// 	[$$ setData:$2];
		// [$$ setLabel:$3];
	}
edge: "\\draw" optproperties noderef "to" optedgenode optnoderef ";"
	{
		Node *s;
		Node *t;
		Node *en;

		// TODO: anchors and edge nodes
		
		s = $3.node;
		if ($6.node) {
			t = $6.node;
			//[edge setTargetAnchor:$6.anchor];
		} else {
			t = $3.node;
			//[edge setTargetAnchor:$3.anchor];
		}

		Edge *edge = assembler->graph()->addEdge(s, t);
		if ($2)
			edge->setData($2);

		// [edge setSourceAnchor:$3.anchor];
		// [edge setEdgeNode:$5];
		
		// [edge setAttributesFromData];
	};

ignoreprop: val | val "=" val;
ignoreprops: ignoreprop ignoreprops | ;
optignoreprops: "[" ignoreprops "]";
boundingbox:
	"\\path" optignoreprops COORD "rectangle" COORD ";"
	{
		// TODO: bounding box
		//[[assembler graph] setBoundingBox:NSRectAroundPoints($3, $5)];
	};

/* vi:ft=yacc:noet:ts=4:sts=4:sw=4
*/
