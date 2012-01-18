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

#import "StyleManager+Storage.h"
#import "Configuration.h"
#import "NodeStyle+Storage.h"
#import "EdgeStyle+Storage.h"

static NSString *nodeStyleGroupPrefix = @"Style ";
static NSString *edgeStyleGroupPrefix = @"EdgeStyle ";

@implementation StyleManager (Storage)

- (void) loadStylesUsingConfigurationName:(NSString*)name {
    if (![Configuration configurationExistsWithName:name]) {
        return;
    }
    NSError *error = nil;
    Configuration *stylesConfig = [Configuration configurationWithName:name loadError:&error];
    if (error != nil) {
        logError (error, @"Could not load styles configuration");
        // stick with the default config
        return;
    }
    NSArray *groups = [stylesConfig groups];
    NSMutableArray *ns = [NSMutableArray arrayWithCapacity:[groups count]];
    NSMutableArray *es = [NSMutableArray arrayWithCapacity:[groups count]];

    for (NSString *groupName in groups) {
        if ([groupName hasPrefix:nodeStyleGroupPrefix]) {
            NodeStyle *style = [[NodeStyle alloc] initFromConfigurationGroup:groupName config:stylesConfig];
            [ns addObject:style];
        } else if ([groupName hasPrefix:edgeStyleGroupPrefix]) {
            EdgeStyle *style = [[EdgeStyle alloc] initFromConfigurationGroup:groupName config:stylesConfig];
            [es addObject:style];
        }
    }

    [self _setNodeStyles:ns];
    [self _setEdgeStyles:es];
}

- (void) saveStylesUsingConfigurationName:(NSString*)name {
    NSError *error = nil;
    Configuration *stylesConfig = [Configuration emptyConfigurationWithName:name];
    NSArray *ns = [self nodeStyles];
    NSArray *es = [self edgeStyles];
    NSUInteger length = [ns count];
    for (int i = 0; i < length; ++i) {
        NodeStyle *style = [ns objectAtIndex:i];
        NSString *groupName = [NSString stringWithFormat:@"%@%d", nodeStyleGroupPrefix, i];
        [style storeToConfigurationGroup:groupName config:stylesConfig];
    }
    length = [es count];
    for (int i = 0; i < length; ++i) {
        EdgeStyle *style = [es objectAtIndex:i];
        NSString *groupName = [NSString stringWithFormat:@"%@%d", edgeStyleGroupPrefix, i];
        [style storeToConfigurationGroup:groupName config:stylesConfig];
    }
    if (![stylesConfig writeToStoreWithError:&error]) {
        logError (error, @"Could not write styles configuration");
    }
}

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
