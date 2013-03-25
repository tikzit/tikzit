//
//  Configuration.h
//  TikZiT
//
//  Copyright 2010 Alex Merry
//
//  This file is part of TikZiT.
//
//  TikZiT is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  TikZiT is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with TikZiT.  If not, see <http://www.gnu.org/licenses/>.
//

#import "Configuration.h"
#import "SupportDir.h"

@implementation Configuration

+ (NSString*) _pathFromName:(NSString*)name {
    return [NSString stringWithFormat:@"%@/%@.conf", [SupportDir userSupportDir], name];
}

+ (BOOL) configurationExistsWithName:(NSString*)name {
    BOOL isDir;
    BOOL exists = [[NSFileManager defaultManager] fileExistsAtPath:[self _pathFromName:name] isDirectory:&isDir];
    return exists && !isDir;
}

+ (Configuration*) emptyConfigurationWithName:(NSString*)name
    { return [[[self alloc] initEmptyWithName:name] autorelease]; }
+ (Configuration*) configurationWithName:(NSString*)name
    { return [[[self alloc] initWithName:name] autorelease]; }
+ (Configuration*) configurationWithName:(NSString*)name loadError:(NSError**)error
    { return [[[self alloc] initWithName:name loadError:error] autorelease]; }

- (id) init
{
    [self release];
    return nil;
}

- (id) initEmptyWithName:(NSString*)n
{
    self = [super init];
    if (self) {
        name = [n retain];
        file = g_key_file_new ();
    }

    return self;
}

- (id) _initFromFile:(NSString*)path error:(NSError**)error
{
    self = [super init];
    if (self) {
        file = g_key_file_new ();

        NSFileManager *manager = [NSFileManager defaultManager];
        if ([manager fileExistsAtPath:path]) {
            gchar *filename = [path glibFilename];

            GError *gerror = NULL;
            g_key_file_load_from_file (file,
                    filename,
                    G_KEY_FILE_NONE,
                    &gerror);
            g_free (filename);

            if (gerror) {
                GErrorToNSError (gerror, error);
                g_error_free (gerror);
            }
        }
    }

    return self;
}

- (id) initWithName:(NSString*)n {
    return [self initWithName:n loadError:NULL];
}

- (id) initWithName:(NSString*)n loadError:(NSError**)error {
    self = [self _initFromFile:[Configuration _pathFromName:n] error:error];

    if (self) {
        name = [n retain];
    }

    return self;
}

- (BOOL) _ensureParentExists:(NSString*)path error:(NSError**)error {
    NSString *directory = [path stringByDeletingLastPathComponent];
    return [[NSFileManager defaultManager] ensureDirectoryExists:directory error:error];
}

- (BOOL) _writeFileTo:(NSString*)path error:(NSError**)error
{
    if (![self _ensureParentExists:path error:error]) {
        return NO;
    }

    BOOL success = NO;
    gsize length;
    gchar *data = g_key_file_to_data (file, &length, NULL); // never reports an error
    if (data && length) {
        GError *gerror = NULL;
        gchar* nativePath = [path glibFilename];
        success = g_file_set_contents (nativePath, data, length, &gerror) ? YES : NO;
        g_free (data);
        g_free (nativePath);
        if (gerror) {
            g_warning ("Failed to write file: %s\n", gerror->message);
            GErrorToNSError (gerror, error);
            g_error_free (gerror);
        }
    } else {
        [[NSFileManager defaultManager] removeFileAtPath:path handler:nil];
        success = YES;
    }

    return success;
}

- (NSString*) name {
    return name;
}

- (void) setName:(NSString*)n {
    [n retain];
    [name release];
    name = n;
}

- (BOOL) writeToStore {
    return [self writeToStoreWithError:NULL];
}

- (BOOL) writeToStoreWithError:(NSError**)error {
    return [self _writeFileTo:[Configuration _pathFromName:name] error:error];
}

- (BOOL) hasKey:(NSString*)key inGroup:(NSString*)group
{
    gboolean result = g_key_file_has_key (file, [group UTF8String], [key UTF8String], NULL);
    return result ? YES : NO;
}

- (BOOL) hasGroup:(NSString*)group
{
    gboolean result = g_key_file_has_group (file, [group UTF8String]);
    return result ? YES : NO;
}

- (NSArray*) keys:(NSString*)group
{
    gsize length;
    gchar **keys = g_key_file_get_keys (file, [group UTF8String], &length, NULL);
    if (!keys)
        length = 0;

    NSMutableArray *array = [NSMutableArray arrayWithCapacity:length];
    for (int i = 0; i < length; ++i) {
        [array addObject:[NSString stringWithUTF8String:keys[i]]];
    }
    g_strfreev (keys);
    return array;
}

- (NSArray*) groups
{
    gsize length;
    gchar **groups = g_key_file_get_groups (file, &length);
    NSMutableArray *array = [NSMutableArray arrayWithCapacity:length];
    for (int i = 0; i < length; ++i) {
        [array addObject:[NSString stringWithUTF8String:groups[i]]];
    }
    g_strfreev (groups);
    return array;
}

- (NSString*) stringEntry:(NSString*)key inGroup:(NSString*)group
{
    return [self stringEntry:key inGroup:group withDefault:nil];
}

- (NSString*) stringEntry:(NSString*)key inGroup:(NSString*)group withDefault:(NSString*)def
{
    NSString *result = def;
    gchar *entry = g_key_file_get_string (file, [group UTF8String], [key UTF8String], NULL);
    if (entry) {
        result = [NSString stringWithUTF8String:entry];
        g_free (entry);
    }
    return result;
}

- (BOOL) booleanEntry:(NSString*)key inGroup:(NSString*)group withDefault:(BOOL)def
{
    GError *error = NULL;
    gboolean result = g_key_file_get_boolean (file, [group UTF8String], [key UTF8String], &error);
    if (error != NULL) {
        g_error_free (error);
        return def;
    } else {
        return result ? YES : NO;
    }
}

- (BOOL) booleanEntry:(NSString*)key inGroup:(NSString*)group
{
    gboolean result = g_key_file_get_boolean (file, [group UTF8String], [key UTF8String], NULL);
    return result ? YES : NO;
}

- (int) integerEntry:(NSString*)key inGroup:(NSString*)group withDefault:(int)def
{
    GError *error = NULL;
    int result = g_key_file_get_integer (file, [group UTF8String], [key UTF8String], &error);
    if (error != NULL) {
        g_error_free (error);
        return def;
    } else {
        return result;
    }
}

- (int) integerEntry:(NSString*)key inGroup:(NSString*)group
{
    return g_key_file_get_integer (file, [group UTF8String], [key UTF8String], NULL);
}

- (double) doubleEntry:(NSString*)key inGroup:(NSString*)group withDefault:(double)def
{
    GError *error = NULL;
    double result = g_key_file_get_double (file, [group UTF8String], [key UTF8String], &error);
    if (error != NULL) {
        g_error_free (error);
        return def;
    } else {
        return result;
    }
}

- (double) doubleEntry:(NSString*)key inGroup:(NSString*)group
{
    return g_key_file_get_double (file, [group UTF8String], [key UTF8String], NULL);
}

- (NSArray*) stringListEntry:(NSString*)key inGroup:(NSString*)group
{
    return [self stringListEntry:key inGroup:group withDefault:nil];
}

- (NSArray*) stringListEntry:(NSString*)key inGroup:(NSString*)group withDefault:(NSArray*)def
{
    gsize length;
    gchar **list = g_key_file_get_string_list (file, [group UTF8String], [key UTF8String], &length, NULL);
    if (list) {
        NSMutableArray *result = [NSMutableArray arrayWithCapacity:length];
        for (int i = 0; i < length; ++i) {
            [result addObject:[NSString stringWithUTF8String:list[i]]];
        }
        return result;
    } else {
        return def;
    }
}

- (NSArray*) booleanListEntry:(NSString*)key inGroup:(NSString*)group
{
    return [self booleanListEntry:key inGroup:group withDefault:nil];
}

- (NSArray*) booleanListEntry:(NSString*)key inGroup:(NSString*)group withDefault:(NSArray*)def
{
    gsize length;
    gboolean *list = g_key_file_get_boolean_list (file, [group UTF8String], [key UTF8String], &length, NULL);
    if (list) {
        NSMutableArray *result = [NSMutableArray arrayWithCapacity:length];
        for (int i = 0; i < length; ++i) {
            [result addObject:[NSNumber numberWithBool:list[i]]];
        }
        return result;
    } else {
        return def;
    }
}

- (NSArray*) integerListEntry:(NSString*)key inGroup:(NSString*)group
{
    return [self integerListEntry:key inGroup:group withDefault:nil];
}

- (NSArray*) integerListEntry:(NSString*)key inGroup:(NSString*)group withDefault:(NSArray*)def
{
    gsize length;
    gint *list = g_key_file_get_integer_list (file, [group UTF8String], [key UTF8String], &length, NULL);
    if (list) {
        NSMutableArray *result = [NSMutableArray arrayWithCapacity:length];
        for (int i = 0; i < length; ++i) {
            [result addObject:[NSNumber numberWithInt:list[i]]];
        }
        return result;
    } else {
        return def;
    }
}

- (NSArray*) doubleListEntry:(NSString*)key inGroup:(NSString*)group
{
    return [self doubleListEntry:key inGroup:group withDefault:nil];
}

- (NSArray*) doubleListEntry:(NSString*)key inGroup:(NSString*)group withDefault:(NSArray*)def
{
    gsize length;
    double *list = g_key_file_get_double_list (file, [group UTF8String], [key UTF8String], &length, NULL);
    if (list) {
        NSMutableArray *result = [NSMutableArray arrayWithCapacity:length];
        for (int i = 0; i < length; ++i) {
            [result addObject:[NSNumber numberWithDouble:list[i]]];
        }
        return result;
    } else {
        return def;
    }
}

- (void) setStringEntry:(NSString*)key inGroup:(NSString*)group value:(NSString*)value
{
    if (value == nil) {
        [self removeKey:key inGroup:group];
        return;
    }
    g_key_file_set_string (file, [group UTF8String], [key UTF8String], [value UTF8String]);
}

- (void) setBooleanEntry:(NSString*)key inGroup:(NSString*)group value:(BOOL)value;
{
    g_key_file_set_boolean (file, [group UTF8String], [key UTF8String], value);
}

- (void) setIntegerEntry:(NSString*)key inGroup:(NSString*)group value:(int)value;
{
    g_key_file_set_integer (file, [group UTF8String], [key UTF8String], value);
}

- (void) setDoubleEntry:(NSString*)key inGroup:(NSString*)group value:(double)value;
{
    g_key_file_set_double (file, [group UTF8String], [key UTF8String], value);
}


- (void) setStringListEntry:(NSString*)key inGroup:(NSString*)group value:(NSArray*)value
{
    if (value == nil) {
        [self removeKey:key inGroup:group];
        return;
    }
    gsize length = [value count];
    const gchar * *list = g_new (const gchar *, length);
    for (int i = 0; i < length; ++i) {
        list[i] = [[value objectAtIndex:i] UTF8String];
    }
    g_key_file_set_string_list (file, [group UTF8String], [key UTF8String], list, length);
    g_free (list);
}

- (void) setBooleanListEntry:(NSString*)key inGroup:(NSString*)group value:(NSArray*)value;
{
    if (value == nil) {
        [self removeKey:key inGroup:group];
        return;
    }
    gsize length = [value count];
    gboolean *list = g_new (gboolean, length);
    for (int i = 0; i < length; ++i) {
        list[i] = [[value objectAtIndex:i] boolValue];
    }
    g_key_file_set_boolean_list (file, [group UTF8String], [key UTF8String], list, length);
    g_free (list);
}

- (void) setIntegerListEntry:(NSString*)key inGroup:(NSString*)group value:(NSArray*)value;
{
    if (value == nil) {
        [self removeKey:key inGroup:group];
        return;
    }
    gsize length = [value count];
    gint *list = g_new (gint, length);
    for (int i = 0; i < length; ++i) {
        list[i] = [[value objectAtIndex:i] intValue];
    }
    g_key_file_set_integer_list (file, [group UTF8String], [key UTF8String], list, length);
    g_free (list);
}

- (void) setDoubleListEntry:(NSString*)key inGroup:(NSString*)group value:(NSArray*)value;
{
    if (value == nil) {
        [self removeKey:key inGroup:group];
        return;
    }
    gsize length = [value count];
    gdouble *list = g_new (gdouble, length);
    for (int i = 0; i < length; ++i) {
        list[i] = [[value objectAtIndex:i] doubleValue];
    }
    g_key_file_set_double_list (file, [group UTF8String], [key UTF8String], list, length);
    g_free (list);
}

- (void) removeGroup:(NSString*)group
{
    g_key_file_remove_group (file, [group UTF8String], NULL);
}

- (void) removeKey:(NSString*)key inGroup:(NSString*)group;
{
    g_key_file_remove_key (file, [group UTF8String], [key UTF8String], NULL);
}

- (void) dealloc
{
    [name release];
    g_key_file_free (file);
    file = NULL;
    [super dealloc];
}

@end

// vim:ft=objc:sts=4:sw=4:et
