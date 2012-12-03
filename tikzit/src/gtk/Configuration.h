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

#import "TZFoundation.h"

/**
 * Manages configuration information in a grouped key-value format.
 */
@interface Configuration : NSObject {
    NSString *name;
    GKeyFile *file;
}

/**
 * Check whether there is any existing configuration.
 */
+ (BOOL) configurationExistsWithName:(NSString*)name;
/**
 * Create a blank configuration with the given name, without loading
 * any existing configuration information.
 *
 * @param name   the name of the configuration
 */
+ (Configuration*) emptyConfigurationWithName:(NSString*)name;
/**
 * Load an existing configuration for the given name.
 *
 * If there was no existing configuration, or it could not be opened,
 * an empty configuration will be returned.
 *
 * @param name   the name of the configuration
 */
+ (Configuration*) configurationWithName:(NSString*)name;
/**
 * Load an existing configuration for the given name.
 *
 * If there was no existing configuration, or it could not be opened,
 * an empty configuration will be returned.
 *
 * @param name   the name of the configuration
 * @param error  this will be set if the configuration exists, but could
 *               not be opened.
 */
+ (Configuration*) configurationWithName:(NSString*)name loadError:(NSError**)error;

/**
 * Initialise the configuration to be empty
 *
 * Does not attempt to load any existing configuration data.
 *
 * @param name  the name of the configuration
 */
- (id) initEmptyWithName:(NSString*)name;
/**
 * Initialise a configuration, loading it if it had previously been stored.
 *
 * If there was no existing configuration, or it could not be opened,
 * an empty configuration will be returned.
 *
 * @param name  the name of the configuration
 */
- (id) initWithName:(NSString*)name;
/**
 * Initialise a configuration, loading it if it had previously been stored.
 *
 * If there was no existing configuration, or it could not be opened,
 * an empty configuration will be returned.
 *
 * @param name   the name of the configuration
 * @param error  this will be set if the configuration exists, but could
 *               not be opened.
 */
- (id) initWithName:(NSString*)name loadError:(NSError**)error;

/**
 * The name of the configuration.
 *
 * Configurations with different names are stored independently.
 */
- (NSString*) name;
/**
 * Set the name of the configuration.
 *
 * This will affect the behaviour of [-writeToStore]
 *
 * Configurations with different names are stored independently.
 */
- (void) setName:(NSString*)name;

/**
 * Writes the configuration to the backing store.
 *
 * The location the configuration is written to is determined by the
 * [-name] property.
 *
 * @result  YES if the configuration was successfully written, NO otherwise
 */
- (BOOL) writeToStore;
/**
 * Writes the configuration to the backing store.
 *
 * The location the configuration is written to is determined by the
 * [-name] property.
 *
 * @param error  this will be set if the configuration could not be written
 *               to the backing store
 * @result       YES if the configuration was successfully written, NO otherwise
 */
- (BOOL) writeToStoreWithError:(NSError**)error;

/**
 * Check whether a particular key exists within a group
 *
 * @param key    the key to check for
 * @param group  the name of the group to look in
 * @result       YES if the key exists, NO otherwise
 */
- (BOOL) hasKey:(NSString*)key inGroup:(NSString*)group;
/**
 * Check whether a particular group exists
 *
 * @param group  the name of the group to check for
 * @result       YES if the group exists, NO otherwise
 */
- (BOOL) hasGroup:(NSString*)group;
/**
 * List the groups in the configuration.
 *
 * @result  a list of group names
 */
- (NSArray*) groups;

/**
 * Get the value associated with a key as a string
 *
 * This is only guaranteed to work if the value was stored as a string.
 *
 * @param key    the key to fetch the data for
 * @param group  the name of the group to look in
 * @result       the value associated with key as a string, or nil
 *               if no string value was associated with key
 */
- (NSString*) stringEntry:(NSString*)key inGroup:(NSString*)group;
/**
 * Get the value associated with a key as a string
 *
 * This is only guaranteed to work if the value was stored as a string.
 *
 * @param key    the key to fetch the data for
 * @param group  the name of the group to look in
 * @param def    the value to return if no string value was associated with key
 * @result       the value associated with key as a string, or default
 */
- (NSString*) stringEntry:(NSString*)key inGroup:(NSString*)group withDefault:(NSString*)def;
/**
 * Get the value associated with a key as a boolean
 *
 * This is only guaranteed to work if the value was stored as a boolean.
 *
 * @param key    the key to fetch the data for
 * @param group  the name of the group to look in
 * @result       the value associated with key as a boolean, or NO
 *               if no boolean value was associated with key
 */
- (BOOL) booleanEntry:(NSString*)key inGroup:(NSString*)group;
/**
 * Get the value associated with a key as a boolean
 *
 * This is only guaranteed to work if the value was stored as a boolean.
 *
 * @param key    the key to fetch the data for
 * @param group  the name of the group to look in
 * @param def    the value to return if no boolean value was associated with key
 * @result       the value associated with key as a boolean, or def
 */
- (BOOL) booleanEntry:(NSString*)key inGroup:(NSString*)group withDefault:(BOOL)def;
/**
 * Get the value associated with a key as a integer
 *
 * This is only guaranteed to work if the value was stored as a integer.
 *
 * @param key    the key to fetch the data for
 * @param group  the name of the group to look in
 * @result       the value associated with key as a integer, or 0
 *               if no integer value was associated with key
 */
- (int) integerEntry:(NSString*)key inGroup:(NSString*)group;
/**
 * Get the value associated with a key as a integer
 *
 * This is only guaranteed to work if the value was stored as a integer.
 *
 * @param key    the key to fetch the data for
 * @param group  the name of the group to look in
 * @param def    the value to return if no integer value was associated with key
 * @result       the value associated with key as a integer, or def
 */
- (int) integerEntry:(NSString*)key inGroup:(NSString*)group withDefault:(int)def;
/**
 * Get the value associated with a key as a double
 *
 * This is only guaranteed to work if the value was stored as a double.
 *
 * @param key    the key to fetch the data for
 * @param group  the name of the group to look in
 * @result       the value associated with key as a double, or 0
 *               if no double value was associated with key
 */
- (double) doubleEntry:(NSString*)key inGroup:(NSString*)group;
/**
 * Get the value associated with a key as a double
 *
 * This is only guaranteed to work if the value was stored as a double.
 *
 * @param key    the key to fetch the data for
 * @param group  the name of the group to look in
 * @param def    the value to return if no double value was associated with key
 * @result       the value associated with key as a double, or def
 */
- (double) doubleEntry:(NSString*)key inGroup:(NSString*)group withDefault:(double)def;

/**
 * Get the value associated with a key as a list of strings
 *
 * This is only guaranteed to work if the value was stored as a
 * list of strings.
 *
 * @param key    the key to fetch the data for
 * @param group  the name of the group to look in
 * @result       the value associated with key as a list of strings,
 *               or nil if no list of strings was associated with key
 */
- (NSArray*) stringListEntry:(NSString*)key inGroup:(NSString*)group;
/**
 * Get the value associated with a key as a list of strings
 *
 * This is only guaranteed to work if the value was stored as a
 * list of strings.
 *
 * @param key    the key to fetch the data for
 * @param group  the name of the group to look in
 * @param def    the value to return if no string list value was associated with key
 * @result       the value associated with key as a list of strings, or def
 */
- (NSArray*) stringListEntry:(NSString*)key inGroup:(NSString*)group withDefault:(NSArray*)def;
/**
 * Get the value associated with a key as a list of booleans
 *
 * This is only guaranteed to work if the value was stored as a
 * list of booleans.
 *
 * @param key    the key to fetch the data for
 * @param group  the name of the group to look in
 * @result       the value associated with key as a list of NSNumber
 *               objects, containing boolean values, or nil
 */
- (NSArray*) booleanListEntry:(NSString*)key inGroup:(NSString*)group;
/**
 * Get the value associated with a key as a list of booleans
 *
 * This is only guaranteed to work if the value was stored as a
 * list of booleans.
 *
 * @param key    the key to fetch the data for
 * @param group  the name of the group to look in
 * @param def    the value to return if no boolean list value was associated with key
 * @result       the value associated with key as a list of NSNumber
 *               objects, containing boolean values, or def
 */
- (NSArray*) booleanListEntry:(NSString*)key inGroup:(NSString*)group withDefault:(NSArray*)def;
/**
 * Get the value associated with a key as a list of integers
 *
 * This is only guaranteed to work if the value was stored as a
 * list of integers.
 *
 * @param key    the key to fetch the data for
 * @param group  the name of the group to look in
 * @result       the value associated with key as a list of NSNumber
 *               objects, containing integer values, or nil
 */
- (NSArray*) integerListEntry:(NSString*)key inGroup:(NSString*)group;
/**
 * Get the value associated with a key as a list of integers
 *
 * This is only guaranteed to work if the value was stored as a
 * list of integers.
 *
 * @param key    the key to fetch the data for
 * @param group  the name of the group to look in
 * @param def    the value to return if no integer list value was associated with key
 * @result       the value associated with key as a list of NSNumber
 *               objects, containing integer values, or def
 */
- (NSArray*) integerListEntry:(NSString*)key inGroup:(NSString*)group withDefault:(NSArray*)def;
/**
 * Get the value associated with a key as a list of doubles
 *
 * This is only guaranteed to work if the value was stored as a
 * list of doubles.
 *
 * @param key    the key to fetch the data for
 * @param group  the name of the group to look in
 * @result       the value associated with key as a list of NSNumber
 *               objects, containing double values, or nil
 */
- (NSArray*) doubleListEntry:(NSString*)key inGroup:(NSString*)group;
/**
 * Get the value associated with a key as a list of doubles
 *
 * This is only guaranteed to work if the value was stored as a
 * list of doubles.
 *
 * @param key    the key to fetch the data for
 * @param group  the name of the group to look in
 * @param def    the value to return if no double list value was associated with key
 * @result       the value associated with key as a list of NSNumber
 *               objects, containing double values, or def
 */
- (NSArray*) doubleListEntry:(NSString*)key inGroup:(NSString*)group withDefault:(NSArray*)def;

/**
 * Associate a string value with a key.
 *
 * Any previous value (of any type) with the same key and group will
 * be overwritten.
 *
 * @param key    the key to associate the value with
 * @param group  the group to store the association in
 * @param value  the value to store
 */
- (void) setStringEntry:(NSString*)key inGroup:(NSString*)group value:(NSString*)value;
/**
 * Associate a boolean value with a key.
 *
 * Any previous value (of any type) with the same key and group will
 * be overwritten.
 *
 * @param key    the key to associate the value with
 * @param group  the group to store the association in
 * @param value  the value to store
 */
- (void) setBooleanEntry:(NSString*)key inGroup:(NSString*)group value:(BOOL)value;
/**
 * Associate a integer value with a key.
 *
 * Any previous value (of any type) with the same key and group will
 * be overwritten.
 *
 * @param key    the key to associate the value with
 * @param group  the group to store the association in
 * @param value  the value to store
 */
- (void) setIntegerEntry:(NSString*)key inGroup:(NSString*)group value:(int)value;
/**
 * Associate a double value with a key.
 *
 * Any previous value (of any type) with the same key and group will
 * be overwritten.
 *
 * @param key    the key to associate the value with
 * @param group  the group to store the association in
 * @param value  the value to store
 */
- (void) setDoubleEntry:(NSString*)key inGroup:(NSString*)group value:(double)value;

/**
 * Associate a list of string values with a key.
 *
 * Any previous value (of any type) with the same key and group will
 * be overwritten.
 *
 * @param key    the key to associate the list with
 * @param group  the group to store the association in
 * @param value  the list to store, as an array of strings
 */
- (void) setStringListEntry:(NSString*)key inGroup:(NSString*)group value:(NSArray*)value;
/**
 * Associate a list of boolean values with a key.
 *
 * Any previous value (of any type) with the same key and group will
 * be overwritten.
 *
 * @param key    the key to associate the list with
 * @param group  the group to store the association in
 * @param value  the list to store, as an array of NSNumber objects
 */
- (void) setBooleanListEntry:(NSString*)key inGroup:(NSString*)group value:(NSArray*)value;
/**
 * Associate a list of integer values with a key.
 *
 * Any previous value (of any type) with the same key and group will
 * be overwritten.
 *
 * @param key    the key to associate the list with
 * @param group  the group to store the association in
 * @param value  the list to store, as an array of NSNumber objects
 */
- (void) setIntegerListEntry:(NSString*)key inGroup:(NSString*)group value:(NSArray*)value;
/**
 * Associate a list of double values with a key.
 *
 * Any previous value (of any type) with the same key and group will
 * be overwritten.
 *
 * @param key    the key to associate the list with
 * @param group  the group to store the association in
 * @param value  the list to store, as an array of NSNumber objects
 */
- (void) setDoubleListEntry:(NSString*)key inGroup:(NSString*)group value:(NSArray*)value;

/**
 * Remove a group from the configuration
 *
 * This will remove all the groups key-value associations.
 */
- (void) removeGroup:(NSString*)group;
/**
 * Remove a key from the configuration
 *
 * @param key    the key to remove
 * @param group  the group to remove it from
 */
- (void) removeKey:(NSString*)key inGroup:(NSString*)group;

@end

// vim:ft=objc:sts=4:sw=4:et
