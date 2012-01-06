#                                               -*- Autoconf -*-
# Process this file with autoconf to produce a configure script.

AC_PREREQ([2.60])
AC_INIT([TikZiT], [0.7],
	[http://sourceforge.net/apps/trac/tikzit],
	[tikzit],
	[http://tikzit.sourceforge.net])
AM_INIT_AUTOMAKE([foreign subdir-objects -Wall -Werror])
AM_SILENT_RULES([yes])
AC_OUTPUT(Makefile
          src/Makefile
          share/Makefile
)
AC_CONFIG_SRCDIR([src/linux/main.m])

m4_include([m4/objc.m4])

# Checks for programs.
AC_PROG_OBJC([gcc clang objc objcc])
AC_LANG([Objective C])

AC_PROG_LEX
AM_PROG_LEX
AC_PROG_YACC

# Checks for libraries.
PKG_CHECK_MODULES([GTK], [gtk+-2.0 >= 2.16.0])
AC_SUBST([GTK_CFLAGS])
AC_SUBST([GTK_LIBS])

PKG_CHECK_MODULES([GDK_PIXBUF], [gdk-pixbuf-2.0 >= 2.16.0])
AC_SUBST([GDK_PIXBUF_CFLAGS])
AC_SUBST([GDK_PIXBUF_LIBS])

PKG_CHECK_MODULES([PANGO], [pango >= 1.16])
AC_SUBST([PANGO_CFLAGS])
AC_SUBST([PANGO_LIBS])

PKG_CHECK_MODULES([CAIRO], [cairo >= 1.4])
AC_SUBST([CAIRO_CFLAGS])
AC_SUBST([CAIRO_LIBS])

GNUSTEPOBJCFLAGS=`eval "gnustep-config --objc-flags"`
AS_IF([test "x$GNUSTEPOBJCFLAGS" = ""],
  [AC_MSG_ERROR([GNUstep not found])])
GNUSTEPLIBS=`eval "gnustep-config --base-libs"`
AS_IF([test "x$GNUSTEPLIBS" = ""],
  [AC_MSG_ERROR([GNUstep not found])])
AC_SUBST([GNUSTEPOBJCFLAGS])
AC_SUBST([GNUSTEPLIBS])

AC_ARG_WITH([poppler], AS_HELP_STRING([--without-poppler], [Ignore presence of poppler, disabling preview support]))

AS_IF([test "x$with_poppler" != "xno"],
  [PKG_CHECK_MODULES([POPPLER],
                     [poppler-glib],
                     [have_poppler=yes],
                     [have_poppler=no])],
  [have_poppler=no])

AS_IF([test "x$have_poppler" = "xyes"],
  [
   AC_SUBST([POPPLER_CFLAGS])
   AC_SUBST([POPPLER_LIBS])
   AC_DEFINE(HAVE_POPPLER, 1)
  ],
  [AS_IF([test "x$with_poppler" = "xyes"],
         [AC_MSG_ERROR([foo requested but not found])]
        )
  ])
AM_CONDITIONAL([HAVE_POPPLER],[test "x$have_poppler" = "xyes"])

# Checks for header files.
AC_FUNC_ALLOCA
AC_CHECK_HEADERS([inttypes.h libintl.h limits.h malloc.h stddef.h stdint.h stdlib.h string.h unistd.h])

# Checks for typedefs, structures, and compiler characteristics.
AC_TYPE_INT16_T
AC_TYPE_INT32_T
AC_TYPE_INT8_T
AC_TYPE_SIZE_T
AC_HEADER_STDBOOL
AC_TYPE_UINT16_T
AC_TYPE_UINT32_T
AC_TYPE_UINT64_T
AC_TYPE_UINT8_T

# Checks for library functions.
AC_FUNC_MALLOC
AC_FUNC_REALLOC
AC_CHECK_FUNCS([floor memset sqrt strdup])

TZ_OBJC2_FEATURES
AS_IF([test "x$tz_cv_objc_properties$tz_cv_objc_fast_enumeration$tz_cv_objc_optional_keyword" != "xyesyesyes"],
  [AC_MSG_ERROR([Your Objective C compiler does not support the required Objective C 2 features])])

AC_OUTPUT
