#include <sys/stat.h>
#if STAT_MACROS_BROKEN
# undef S_ISDIR
#endif
#if !defined S_ISDIR && defined S_IFDIR
# define S_ISDIR(mode) (((mode) & S_IFMT) == S_IFDIR)
#endif
#if !S_IRUSR && S_IREAD
# define S_IRUSR S_IREAD
#endif
#if !S_IRUSR
# define S_IRUSR 00400
#endif
#if !S_IWUSR && S_IWRITE
# define S_IWUSR S_IWRITE
#endif
#if !S_IWUSR
# define S_IWUSR 00200
#endif
#if !S_IXUSR && S_IEXEC
# define S_IXUSR S_IEXEC
#endif
#if !S_IXUSR
# define S_IXUSR 00100
#endif
