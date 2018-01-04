/* A Bison parser, made by GNU Bison 2.3.  */

/* Skeleton interface for Bison's Yacc-like parsers in C

   Copyright (C) 1984, 1989, 1990, 2000, 2001, 2002, 2003, 2004, 2005, 2006
   Free Software Foundation, Inc.

   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; either version 2, or (at your option)
   any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, Inc., 51 Franklin Street, Fifth Floor,
   Boston, MA 02110-1301, USA.  */

/* As a special exception, you may create a larger work that contains
   part or all of the Bison parser skeleton and distribute that work
   under terms of your choice, so long as that work isn't itself a
   parser generator using the skeleton or a modified version thereof
   as a parser skeleton.  Alternatively, if you modify or redistribute
   the parser skeleton itself, you may (at your option) remove this
   special exception, which will cause the skeleton and the resulting
   Bison output files to be licensed under the GNU General Public
   License without this special exception.

   This special exception was added by the Free Software Foundation in
   version 2.2 of Bison.  */

/* Tokens.  */
#ifndef YYTOKENTYPE
# define YYTOKENTYPE
   /* Put the tokens into the symbol table, so that GDB and other debuggers
      know about them.  */
   enum yytokentype {
     BEGIN_TIKZPICTURE_CMD = 258,
     END_TIKZPICTURE_CMD = 259,
     BEGIN_PGFONLAYER_CMD = 260,
     END_PGFONLAYER_CMD = 261,
     DRAW_CMD = 262,
     NODE_CMD = 263,
     PATH_CMD = 264,
     RECTANGLE = 265,
     NODE = 266,
     AT = 267,
     TO = 268,
     SEMICOLON = 269,
     COMMA = 270,
     LEFTPARENTHESIS = 271,
     RIGHTPARENTHESIS = 272,
     LEFTBRACKET = 273,
     RIGHTBRACKET = 274,
     FULLSTOP = 275,
     EQUALS = 276,
     COORD = 277,
     PROPSTRING = 278,
     REFSTRING = 279,
     DELIMITEDSTRING = 280,
     UNKNOWN_BEGIN_CMD = 281,
     UNKNOWN_END_CMD = 282,
     UNKNOWN_CMD = 283,
     UNKNOWN_STR = 284,
     UNCLOSED_DELIM_STR = 285
   };
#endif
/* Tokens.  */
#define BEGIN_TIKZPICTURE_CMD 258
#define END_TIKZPICTURE_CMD 259
#define BEGIN_PGFONLAYER_CMD 260
#define END_PGFONLAYER_CMD 261
#define DRAW_CMD 262
#define NODE_CMD 263
#define PATH_CMD 264
#define RECTANGLE 265
#define NODE 266
#define AT 267
#define TO 268
#define SEMICOLON 269
#define COMMA 270
#define LEFTPARENTHESIS 271
#define RIGHTPARENTHESIS 272
#define LEFTBRACKET 273
#define RIGHTBRACKET 274
#define FULLSTOP 275
#define EQUALS 276
#define COORD 277
#define PROPSTRING 278
#define REFSTRING 279
#define DELIMITEDSTRING 280
#define UNKNOWN_BEGIN_CMD 281
#define UNKNOWN_END_CMD 282
#define UNKNOWN_CMD 283
#define UNKNOWN_STR 284
#define UNCLOSED_DELIM_STR 285




#if ! defined YYSTYPE && ! defined YYSTYPE_IS_DECLARED
typedef union YYSTYPE
#line 43 "../tikzit/src/data/tikzparser.y"
{
    char *str;
    GraphElementProperty *prop;
    GraphElementData *data;
    Node *node;
    QPointF *pt;
    struct noderef noderef;
}
/* Line 1529 of yacc.c.  */
#line 118 "../tikzit/src/data/tikzparser.parser.hpp"
	YYSTYPE;
# define yystype YYSTYPE /* obsolescent; will be withdrawn */
# define YYSTYPE_IS_DECLARED 1
# define YYSTYPE_IS_TRIVIAL 1
#endif



#if ! defined YYLTYPE && ! defined YYLTYPE_IS_DECLARED
typedef struct YYLTYPE
{
  int first_line;
  int first_column;
  int last_line;
  int last_column;
} YYLTYPE;
# define yyltype YYLTYPE /* obsolescent; will be withdrawn */
# define YYLTYPE_IS_DECLARED 1
# define YYLTYPE_IS_TRIVIAL 1
#endif


