#                                               -*- Autoconf -*-
# Process this file with autoconf to produce a configure script.

AC_PREREQ([2.60])
AC_INIT([TikZiT], [1.0],
	[http://sourceforge.net/apps/trac/tikzit],
	[tikzit],
	[http://tikzit.sourceforge.net])
AM_INIT_AUTOMAKE([foreign subdir-objects -Wall -Werror])
AM_SILENT_RULES([yes])
AC_OUTPUT(Makefile
          src/Makefile
          share/Makefile
)
AC_CONFIG_SRCDIR([src/gtk/main.m])

m4_include([m4/objc.m4])

# Checks for programs.
AC_PROG_OBJC([gcc clang objc objcc])
AC_LANG([Objective C])

AC_CHECK_PROGS([FLEX], [flex lex], [flex])
AS_IF([$FLEX --version 2>/dev/null | grep "^flex" >/dev/null 2>/dev/null],[],
  [
    AC_MSG_WARN([flex not found; this may cause problems for developers])
    # in case a lex that wasn't flex was found
    FLEX=flex
  ])
AM_MISSING_PROG([LEX], [$FLEX])

AC_CHECK_PROGS([BISON], [bison yacc], [bison])
AS_IF([$BISON --version 2>/dev/null | grep "^bison" >/dev/null 2>/dev/null],[],
  [
    AC_MSG_WARN([bison not found; this may cause problems for developers])
    # in case a yacc that wasn't bison was found
    BISON=bison
  ])
AM_MISSING_PROG([YACC], [$BISON])

# Checks for libraries.
FOUNDATION_OBJCFLAGS=`eval "gnustep-config --objc-flags"`
AS_IF([test "x$FOUNDATION_OBJCFLAGS" = "x"],
  [AC_MSG_ERROR([GNUstep not found])])
FOUNDATION_LIBS=`eval "gnustep-config --base-libs"`
AS_IF([test "x$FOUNDATION_LIBS" = "x"],
  [AC_MSG_ERROR([GNUstep not found])])
AC_SUBST([FOUNDATION_OBJCFLAGS])
AC_SUBST([FOUNDATION_LIBS])

TZ_TEST_OBJCFLAGS="$FOUNDATION_OBJCFLAGS"
TZ_TEST_LDFLAGS="$FOUNDATION_LIBS"

TZ_OBJC_FOUNDATION
AS_IF([test "x$tz_cv_objc_foundation" != "xyes"],
  [AC_MSG_ERROR([Objective C Foundation not found -- missing gnustep-base(-devel)?])])

AC_ARG_WITH([poppler], AS_HELP_STRING([--without-poppler], [Ignore presence of poppler, disabling preview support]))

AS_IF([test "x$with_poppler" != "xno"],
  [
    AC_MSG_CHECKING([for poppler-glib])
    PKG_CHECK_EXISTS([poppler-glib >= 0.10],
                     [have_poppler=yes],
                     [have_poppler=no])
    AS_IF([test "x$have_poppler" = "xyes"],
      [
        AC_MSG_RESULT([yes])
        AC_DEFINE(HAVE_POPPLER, 1)
      ],
      [
        AC_MSG_RESULT([no])
        AS_IF([test "x$with_poppler" = "xyes"],
              [AC_MSG_ERROR([poppler requested but not found (note that poppler-glib is required)])]
             )
      ])
  ],
  [have_poppler=no])
AM_CONDITIONAL([HAVE_POPPLER],[test "x$have_poppler" = "xyes"])

# Test all the pkg-config stuff together, so that
# dependencies and duplicate flags are correctly handled
AS_IF([test "x$have_poppler" = "xyes"],
  [PKG_CHECK_MODULES([GTK], [gtk+-2.0 >= 2.18.0 gdk-pixbuf-2.0 >= 2.16.0 pango >= 1.16 cairo >= 1.4 poppler-glib >= 0.10])],
  [PKG_CHECK_MODULES([GTK], [gtk+-2.0 >= 2.18.0 gdk-pixbuf-2.0 >= 2.16.0 pango >= 1.16 cairo >= 1.4])])

# Checks for header files.
AC_FUNC_ALLOCA
AC_CHECK_HEADERS([inttypes.h libintl.h limits.h malloc.h stddef.h stdint.h stdlib.h string.h unistd.h])

# Checks for typedefs, structures, and compiler characteristics.
AC_TYPE_INT16_T
AC_TYPE_INT32_T
AC_TYPE_INT8_T
AC_TYPE_SIZE_T
AC_TYPE_UINT16_T
AC_TYPE_UINT32_T
AC_TYPE_UINT64_T
AC_TYPE_UINT8_T
AC_HEADER_STDBOOL
AC_HEADER_STAT
AC_CHECK_HEADERS([stdint.h inttypes.h unistd.h sys/time.h time.h])

# Checks for library functions.
AC_FUNC_MALLOC
AC_FUNC_REALLOC
AC_CHECK_FUNCS([floor gettimeofday memset mkdtemp sqrt strdup])

TZ_OBJC2_FEATURES
AS_IF([test "x$tz_cv_objc_properties$tz_cv_objc_fast_enumeration$tz_cv_objc_optional_keyword" != "xyesyesyes"],
  [AC_MSG_ERROR([Your Objective C compiler does not support the required Objective C 2 features])])

dnl ----------------------------------------------------------------------------
dnl
dnl  platform-specific stuff.

AC_CANONICAL_HOST
have_msw="no"
case $host_os in

   *mingw32*)
     have_msw="yes"
     OBJCFLAGS="$OBJCFLAGS -mwindows"
     AC_SUBST([WINDOWS])
     AC_SUBST([WIN32])
     AC_SUBST([_WIN32])
     ;;

esac

AM_CONDITIONAL([WINDOWS],[test "x$have_msw" = "xyes"])

AS_IF([test "x$with_poppler" != "xno"],
  [AS_IF([test "x$have_poppler" != "xyes"],
    AC_MSG_WARN([poppler-glib was not found; preview support will be disabled])
    )]
  )

AC_OUTPUT

# vi:sts=2:sw=2:et
