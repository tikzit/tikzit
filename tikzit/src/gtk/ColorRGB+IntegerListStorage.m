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

#import "ColorRGB+IntegerListStorage.h"

@implementation ColorRGB (IntegerListStorage)

+ (ColorRGB*) colorFromValueList:(NSArray*)values {
    if ([values count] != 3) {
        return nil;
    }

    unsigned short redValue = [[values objectAtIndex:0] intValue];
    unsigned short greenValue = [[values objectAtIndex:1] intValue];
    unsigned short blueValue = [[values objectAtIndex:2] intValue];
    return [ColorRGB colorWithRed:redValue green:greenValue blue:blueValue];
}

- (id) initFromValueList:(NSArray*)values {
    if ([values count] != 3) {
        [self release];
        return nil;
    }

    unsigned short redValue = [[values objectAtIndex:0] intValue];
    unsigned short greenValue = [[values objectAtIndex:1] intValue];
    unsigned short blueValue = [[values objectAtIndex:2] intValue];

    return [self initWithRed:redValue green:greenValue blue:blueValue];
}

- (NSArray*) valueList {
    NSMutableArray *array = [NSMutableArray arrayWithCapacity:3];
    [array addObject:[NSNumber numberWithInt:[self red]]];
    [array addObject:[NSNumber numberWithInt:[self green]]];
    [array addObject:[NSNumber numberWithInt:[self blue]]];
    return array;
}

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
