/*
 * Copyright 2011-2012  Alex Merry <alex.merry@kdemail.net>
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

#import "HandTool.h"

#import "GraphRenderer.h"
#import "TikzDocument.h"
#import "tzstockitems.h"

@implementation HandTool
- (NSString*) name { return @"Drag Tool"; }
- (const gchar*) stockId { return TIKZIT_STOCK_DRAG; }
- (NSString*) helpText { return @"Move the diagram to view different parts"; }
- (NSString*) shortcut { return @"m"; }
@synthesize activeRenderer=renderer;

+ (id) tool {
    return [[[self alloc] init] autorelease];
}

- (id) init {
    return [super init];
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];

    [renderer release];

    [super dealloc];
}

- (GtkWidget*) configurationWidget { return NULL; }

- (void) mousePressAt:(NSPoint)pos withButton:(MouseButton)button andMask:(InputMask)mask {
    if (button != LeftButton)
        return;

    dragOrigin = pos;
    oldGraphOrigin = [[renderer transformer] origin];
}

- (void) mouseMoveTo:(NSPoint)pos withButtons:(MouseButton)buttons andMask:(InputMask)mask {
    if (!(buttons & LeftButton))
        return;

    NSPoint newGraphOrigin = oldGraphOrigin;
    newGraphOrigin.x += pos.x - dragOrigin.x;
    newGraphOrigin.y += pos.y - dragOrigin.y;
    [[renderer transformer] setOrigin:newGraphOrigin];
    [renderer invalidateGraph];
}

- (void) mouseReleaseAt:(NSPoint)pos withButton:(MouseButton)button andMask:(InputMask)mask {}

- (void) renderWithContext:(id<RenderContext>)context onSurface:(id<Surface>)surface {}
- (void) loadConfiguration:(Configuration*)config {}
- (void) saveConfiguration:(Configuration*)config {}
@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
