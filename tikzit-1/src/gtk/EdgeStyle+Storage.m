/*
 * Copyright 2011  Alex Merry <dev@randomguy3.me.uk>
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

#import "EdgeStyle+Storage.h"
#import "ColorRGB+IntegerListStorage.h"

@implementation EdgeStyle (Storage)

- (id) initFromConfigurationGroup:(NSString*)groupName config:(Configuration*)configFile {
    self = [self init];

    if (self) {
        [self setName:[configFile stringEntry:@"Name" inGroup:groupName withDefault:name]];
        [self setCategory:[configFile stringEntry:@"Category" inGroup:groupName withDefault:category]];
        headStyle = [configFile integerEntry:@"HeadStyle" inGroup:groupName withDefault:headStyle];
        tailStyle = [configFile integerEntry:@"TailStyle" inGroup:groupName withDefault:tailStyle];
        decorationStyle = [configFile integerEntry:@"DecorationStyle" inGroup:groupName withDefault:decorationStyle];
        thickness = [configFile doubleEntry:@"Thickness" inGroup:groupName withDefault:thickness];
        [self setColorRGB:
            [ColorRGB colorFromValueList:
                [configFile integerListEntry:@"Color"
                                     inGroup:groupName
                                     withDefault:[colorRGB valueList]]]];
    }

    return self;
}

- (void) storeToConfigurationGroup:(NSString*)groupName config:(Configuration*)configFile {
    [configFile setStringEntry:@"Name" inGroup:groupName value:name];
    [configFile setStringEntry:@"Category" inGroup:groupName value:category];
    [configFile setIntegerEntry:@"HeadStyle" inGroup:groupName value:headStyle];
    [configFile setIntegerEntry:@"TailStyle" inGroup:groupName value:tailStyle];
    [configFile setIntegerEntry:@"DecorationStyle" inGroup:groupName value:decorationStyle];
    [configFile setDoubleEntry:@"Thickness" inGroup:groupName value:thickness];
    [configFile setIntegerListEntry:@"Color" inGroup:groupName value:[[self colorRGB] valueList]];
}

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
