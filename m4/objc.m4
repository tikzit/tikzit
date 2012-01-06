# Checks for Objective C 2 feature support
# and sets the shell variables
# tz_cv_objc_properties
# tz_cv_objc_fast_enumeration
# tz_cv_objc_optional_keyword
# to either "yes" or "no"
#
AC_DEFUN([TZ_OBJC2_FEATURES],
[
tz_old_objcflags="$OBJCFLAGS"
OBJCFLAGS="$OBJCFLAGS `eval "gnustep-config --objc-flags"`"

AC_CACHE_CHECK([for Objective C 2 @property support],
	       [tz_cv_objc_properties],
[AC_COMPILE_IFELSE(
  [AC_LANG_SOURCE([[
#import <Foundation/Foundation.h>

@interface TestObj : NSObject {
	int intProp1;
	NSObject *copyObjProp;
	NSObject *fooProp;
}
@property (assign,nonatomic) int intProp;
@property (retain,readonly) NSObject *retainObjProp;
@property (copy,readwrite) NSObject *copyObjProp;
@property (retain,getter=foo,setter=foo1:) NSObject *fooProp;
@end

@implementation TestObj
@synthesize intProp=intProp1;
@dynamic retainObjProp;
- (NSObject*) retainObjProp { return nil; }
@synthesize copyObjProp;
@synthesize fooProp;
@end

int main(void) {
	TestObj *obj = [[TestObj alloc] init];
	obj.intProp = 4;
	NSObject *result = obj.retainObjProp;
	return 0;
}
   ]])],
  [tz_cv_objc_properties=yes],
  [tz_cv_objc_properties=no])])


AC_CACHE_CHECK([for Objective C 2 fast enumeration support],
	       [tz_cv_objc_fast_enumeration],
[AC_COMPILE_IFELSE(
  [AC_LANG_SOURCE([[
#import <Foundation/Foundation.h>

int main(void) {
	NSArray *array = [NSArray arrayWithObjects: @"One", @"Two", @"Three", @"Four", nil];
	for (NSString *element in array) {
		NSLog(@"element: %@", element);
	}
	return 0;
}
   ]])],
  [tz_cv_objc_fast_enumeration=yes],
  [tz_cv_objc_fast_enumeration=no])])

AC_CACHE_CHECK([for Objective C 2 @optional support],
	       [tz_cv_objc_optional_keyword],
[AC_COMPILE_IFELSE(
  [AC_LANG_SOURCE([[
#import <Foundation/Foundation.h>

@protocol Foo
@optional
- (void) foo;
@required
- (void) bar;
@end

int main(void) {
	return 0;
}
   ]])],
  [tz_cv_objc_optional_keyword=yes],
  [tz_cv_objc_optional_keyword=no])])

OBJCFLAGS="$tz_old_objcflags"
])
