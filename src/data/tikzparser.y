%{
/*!
 * \file tikzparser.y
 *
 * The parser for tikz input.
 */

/*
 * Copyright 2010       Chris Heunen
 * Copyright 2010-2017  Aleks Kissinger
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

%define parse.error verbose
/* enable maintaining locations for better error messages */
%locations
/* the name of the header file */
/*%defines "common/tikzparser.h"*/
/* make it re-entrant (no global variables) */
%define api.pure
/* We use a pure (re-entrant) lexer.  This means yylex
   will take a void* (opaque) type to maintain its state */
%lex-param {void *scanner}
/* Since this parser is also pure, yyparse needs to take
   that lexer state as an argument */
%parse-param {void *scanner}

/* possible data types for semantic values */
%union {
    char *str;
    GraphElementProperty *prop;
    GraphElementData *data;
    Node *node;
    QPointF *pt;
    struct noderef noderef;
}

%{
#include "node.h"
#include "edge.h"
#include "graphelementdata.h"
#include "graphelementproperty.h"

#include "tikzlexer.h"
#include "tikzassembler.h"
/* the assembler (used by this parser) is stored in the lexer
   state as "extra" data */
#define assembler yyget_extra(scanner)

/* pass errors off to the assembler */
void yyerror(YYLTYPE *yylloc, void * /*scanner*/, const char *str) {
	// TODO: implement reportError()
	//assembler->reportError(str, yylloc);
    qDebug() << "\nparse error: " << str << " line:" << yylloc->first_line;
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
%token TIKZSTYLE_CMD "\\tikzstyle"
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
%token <pt> TCOORD "coordinate"
%token <str> PROPSTRING "key/value string"
%token <str> REFSTRING "string"
%token <str> DELIMITEDSTRING "{-delimited string"

%token UNKNOWN_BEGIN_CMD "unknown \\begin command"
%token UNKNOWN_END_CMD "unknown \\end command"
%token UNKNOWN_CMD "unknown latex command"
%token UNKNOWN_STR "unknown string"
%token UNCLOSED_DELIM_STR "unclosed {-delimited string"

%type<str>   nodename
%type<str>   optanchor
%type<str>   val
%type<prop>    property
%type<data>    extraproperties
%type<data>    properties
%type<data>    optproperties
%type<node>    optedgenode
%type<noderef> noderef
%type<noderef> optnoderef

%%


tikz: tikzstyles | tikzpicture;

tikzstyles: tikzstyles tikzstyle | ;
tikzstyle: "\\tikzstyle" DELIMITEDSTRING "=" "[" properties "]"
    {
        if (assembler->isTikzStyles()) {
            assembler->tikzStyles()->addStyle(QString($2), $5);
        }
    }

tikzpicture: "\\begin{tikzpicture}" optproperties tikzcmds "\\end{tikzpicture}"
    {
        if (assembler->isGraph() && $2) {
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
        $1->add(*$2);
        delete $2;
        $$ = $1;
	};
extraproperties:
	extraproperties property ","
	{
        $1->add(*$2);
        delete $2;
        $$ = $1;
	}
    | { $$ = new GraphElementData(); };
property:
	val "=" val
    {
        GraphElementProperty *p = new GraphElementProperty(QString($1),QString($3));
        free($1);
        free($3);
        $$ = p;
    }
	| val
    {
        GraphElementProperty *a = new GraphElementProperty(QString($1));
        free($1);
        $$ = a;
    };
val: PROPSTRING { $$ = $1; } | DELIMITEDSTRING { $$ = $1; };

nodename: "(" REFSTRING ")" { $$ = $2; };
node: "\\node" optproperties nodename "at" TCOORD DELIMITEDSTRING ";"
	{
        Node *node = new Node();

        if ($2) {
            node->setData($2);
        }
        //qDebug() << "node name: " << $3;
        node->setName(QString($3));
        node->setLabel(QString($6));
        free($3);
        free($6);

        node->setPoint(*$5);
        delete $5;

        assembler->graph()->addNode(node);
        assembler->addNodeToMap(node);
	};

optanchor:  { $$ = 0; } | "." REFSTRING { $$ = $2; };
noderef: "(" REFSTRING optanchor ")"
	{
        $$.node = assembler->nodeWithName(QString($2));
        free($2);
        $$.anchor = $3;
	};
optnoderef:
	noderef { $$ = $1; }
	| "(" ")" { $$.node = 0; $$.anchor = 0; }
optedgenode:
	{ $$ = 0; }
	| "node" optproperties DELIMITEDSTRING
    {
        $$ = new Node();
        if ($2)
            $$->setData($2);
        $$->setLabel(QString($3));
        free($3);
	}
edge: "\\draw" optproperties noderef "to" optedgenode optnoderef ";"
	{
        Node *s;
        Node *t;
		
        s = $3.node;

        if ($6.node) {
            t = $6.node;
        } else {
            t = s;
        }

        // if the source or the target of the edge doesn't exist, quietly ignore it.
        if (s != 0 && t != 0) {
            Edge *edge = new Edge(s, t);
            if ($2) {
                edge->setData($2);
                edge->setAttributesFromData();
            }

            if ($5)
                edge->setEdgeNode($5);
            if ($3.anchor) {
                edge->setSourceAnchor(QString($3.anchor));
                free($3.anchor);
            }

            if ($6.node) {
                if ($6.anchor) {
                    edge->setTargetAnchor(QString($6.anchor));
                    free($6.anchor);
                }
            } else {
                edge->setTargetAnchor(edge->sourceAnchor());
            }

            assembler->graph()->addEdge(edge);
        }
	};

ignoreprop: val | val "=" val;
ignoreprops: ignoreprop ignoreprops | ;
optignoreprops: "[" ignoreprops "]";
boundingbox:
    "\\path" optignoreprops TCOORD "rectangle" TCOORD ";"
	{
        assembler->graph()->setBbox(QRectF(*$3, *$5));
        delete $3;
        delete $5;
	};

/* vi:ft=yacc:noet:ts=4:sts=4:sw=4
*/
