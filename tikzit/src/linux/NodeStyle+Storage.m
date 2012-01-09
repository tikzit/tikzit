/*
 * Copyright 2011  Alex Merry <dev@randomguy3.me.uk>
 * Copyright 2010  Chris Heunen
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

#import "NodeStyle+Storage.h"
#import "ColorRGB+IntegerListStorage.h"

@implementation NodeStyle (Storage)

- (id) initFromConfigurationGroup:(NSString*)groupName config:(Configuration*)configFile {
    self = [self init];

    if (self) {
        [self setName:[configFile stringEntry:@"Name" inGroup:groupName withDefault:name]];
        [self setCategory:[configFile stringEntry:@"Category" inGroup:groupName withDefault:category]];
        [self setShapeName:[configFile stringEntry:@"ShapeName" inGroup:groupName withDefault:shapeName]];
        [self setScale:[configFile doubleEntry:@"Scale" inGroup:groupName withDefault:scale]];
        [self setStrokeThickness:[configFile integerEntry:@"StrokeThickness"
                                              inGroup:groupName
                                              withDefault:strokeThickness]];
        [self setStrokeColorRGB:
            [ColorRGB colorFromValueList:
                [configFile integerListEntry:@"StrokeColor"
                                     inGroup:groupName
                                     withDefault:[strokeColorRGB valueList]]]];
        [self setFillColorRGB:
            [ColorRGB colorFromValueList:
                [configFile integerListEntry:@"FillColor"
                                     inGroup:groupName
                                     withDefault:[fillColorRGB valueList]]]];
    }

    return self;
}

- (void) storeToConfigurationGroup:(NSString*)groupName config:(Configuration*)configFile {
    [configFile setStringEntry:@"Name" inGroup:groupName value:[self name]];
    [configFile setStringEntry:@"Category" inGroup:groupName value:[self category]];
    [configFile setStringEntry:@"ShapeName" inGroup:groupName value:[self shapeName]];
    [configFile setDoubleEntry:@"Scale" inGroup:groupName value:[self scale]];
    [configFile setIntegerEntry:@"StrokeThickness" inGroup:groupName value:[self strokeThickness]];
    [configFile setIntegerListEntry:@"StrokeColor" inGroup:groupName value:[[self strokeColorRGB] valueList]];
    [configFile setIntegerListEntry:@"FillColor" inGroup:groupName value:[[self fillColorRGB] valueList]];
}

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
