%{
/*!
 * \file tikzlexer.l
 *
 * The lexer for tikz input.
 */
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
#include "tikzparser.parser.hpp"

#include <sstream>


#define YY_USER_ACTION \
	yylloc->first_line = yylloc->last_line; \
	yylloc->first_column = yylloc->last_column + 1; \
	yylloc->last_column = yylloc->first_column + yyleng - 1;

%}

%option reentrant bison-bridge bison-locations 8bit
%option bison-locations 8bit
%option nounput
%option yylineno
%option noyywrap
%option header-file="tikzlexer.h"
%option extra-type="TikzAssembler *"

%s props
%s xcoord
%s ycoord
%s noderef

FLOAT \-?[0-9]*(\.[0-9]+)?

%%

 /* whitespace is ignored, except for position counting; we don't
    count formfeed and vtab as whitespace, because it's not obvious
    how they should be dealt with and no-one actually uses them */

 /* lex will take the longest-matching string */
<INITIAL,xcoord,ycoord,props,noderef>\r\n|\r|\n {
	yylloc->first_line += 1;
	yylloc->last_line = yylloc->first_line;
	yylloc->first_column = yylloc->last_column = 0;
}
<INITIAL,xcoord,ycoord,props,noderef>[\t ]+  {  }

\\begin\{tikzpicture\}         {  return BEGIN_TIKZPICTURE_CMD; }
\\end\{tikzpicture\}           {  return END_TIKZPICTURE_CMD; }
\\tikzstyle                    {  return TIKZSTYLE_CMD; }
\\begin\{pgfonlayer\}          {  return BEGIN_PGFONLAYER_CMD; }
\\end\{pgfonlayer\}            {  return END_PGFONLAYER_CMD; }
\\draw                         {  return DRAW_CMD; }
\\node                         {  return NODE_CMD; }
\\path                         {  return PATH_CMD; }
rectangle                      {  return RECTANGLE; }
node                           {  return NODE; }
at                             {  return AT; }
to                             {  return TO; }
;                              {  return SEMICOLON; }
=                              {  return EQUALS; }

\([ ]*{FLOAT}[ ]*,[ ]*{FLOAT}[ ]*\) {
	yylloc->last_column = yylloc->first_column + 1;
	yyless(1);
	BEGIN(xcoord);
}
<xcoord>{FLOAT} {
    yylval->pt = new QPointF();
    yylval->pt->setX(strtod(yytext,NULL));
	BEGIN(ycoord);
}
<ycoord>, {  }
<ycoord>{FLOAT} {
    yylval->pt->setY(strtod(yytext,NULL));
}
<ycoord>\) {
	BEGIN(INITIAL);
    return TCOORD;
}

 /* when we see "[", change parsing mode */
\[ /*syntaxhlfix]*/ {
	BEGIN(props);
	return LEFTBRACKET;
}
<props>= {  return EQUALS; }
<props>, {  return COMMA; }
 /* technically, it is possible to have newlines in the middle of
	property names or values, but in practice this is unlikely and
	screws up our line counting */
<props>[^=,\{\] \t\n]([^=,\{\]\n]*[^=,\{\] \t\n])? {
    char *str = (char*)malloc(sizeof(char)*yyleng + 1);
    strncpy(str, yytext, yyleng + 1);
    yylval->str = str;
	return PROPSTRING;
}
<props>\] {
	BEGIN(INITIAL);
	return RIGHTBRACKET;
}

\( {
	BEGIN(noderef);
	return LEFTPARENTHESIS;
}
<noderef>\. {
	return FULLSTOP;
}
 /* we assume node names (and anchor names) never contain
	newlines */
<noderef>[^\.\{\)\n]+ {
    //qDebug() << "nodename: " << yytext << "  size: " << strlen(yytext);
    char *str = (char*)malloc(sizeof(char)*yyleng + 1);
    strncpy(str, yytext, yyleng+1);
    yylval->str = str;
	return REFSTRING;
}
<noderef>\) {
	BEGIN(INITIAL);
	return RIGHTPARENTHESIS;
}

<INITIAL,props>\{ {
    std::stringstream buf;
	unsigned int brace_depth = 1;
    unsigned int escape = 0;
	while (1) {
        char c = yyinput(yyscanner);
		// eof reached before closing brace
		if (c == '\0' || c == EOF) {
			return UNCLOSED_DELIM_STR;
		}

		yylloc->last_column += 1;
		yyleng += 1;
		if (escape) {
			escape = 0;
		} else if (c == '\\') {
			escape = 1;
		} else if (c == '{') {
			brace_depth++;
		} else if (c == '}') {
			brace_depth--;
			if (brace_depth == 0) break;
		} else if (c == '\n') {
			yylloc->last_line += 1;
			yylloc->last_column = 0;
		}
        buf << c;
	}

    char *str = (char*)malloc(sizeof(char) * yyleng + 1);
    strncpy(str, buf.str().c_str(), yyleng + 1);
    //str[len] = 0;
    yylval->str = str;
    //qDebug() << "got delim string: " << str;
	return DELIMITEDSTRING;
}

\\begin { return UNKNOWN_BEGIN_CMD; }
\\end { return UNKNOWN_END_CMD; }
\\[a-zA-Z0-9]+ { return UNKNOWN_CMD; }
[a-zA-Z0-9]+ { return UNKNOWN_STR; }
<INITIAL,xcoord,ycoord,props,noderef>. { return UNKNOWN_STR; }

 /* vi:ft=lex:noet:ts=4:sts=4:sw=4:
 */
