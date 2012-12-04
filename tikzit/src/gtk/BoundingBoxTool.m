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

#import "BoundingBoxTool.h"

#import "GraphRenderer.h"
#import "TikzDocument.h"
#import "tzstockitems.h"

static const float handle_size = 8.0;
float sideHandleTop(NSRect bbox) {
    return (NSMinY(bbox) + NSMaxY(bbox) - handle_size)/2.0f;
}
float tbHandleLeft(NSRect bbox) {
    return (NSMinX(bbox) + NSMaxX(bbox) - handle_size)/2.0f;
}

@interface BoundingBoxTool (Private)
- (NSRect) screenBoundingBox;
- (ResizeHandle) boundingBoxResizeHandleAt:(NSPoint)p;
- (NSRect) boundingBoxResizeHandleRect:(ResizeHandle)handle;
- (void) setResizeCursorForHandle:(ResizeHandle)handle;
@end

@implementation BoundingBoxTool
- (NSString*) name { return @"Bounding Box Tool"; }
- (const gchar*) stockIcon { return TIKZIT_STOCK_BOUNDING_BOX; }
- (NSString*) helpText { return @"Set the bounding box"; }
- (NSString*) shortcut { return @"b"; }

+ (id) tool {
    return [[[self alloc] init] autorelease];
}

- (id) init {
    self = [super init];

    if (self) {
        currentResizeHandle = NoHandle;
    }

    return self;
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];

    [renderer release];

    [super dealloc];
}

- (GraphRenderer*) activeRenderer { return renderer; }
- (void) setActiveRenderer:(GraphRenderer*)r {
    if (r == renderer)
        return;

    [[renderer surface] setCursor:NormalCursor];

    [r retain];
    [renderer release];
    renderer = r;
}

- (GtkWidget*) configurationWidget { return NULL; }

- (void) mousePressAt:(NSPoint)pos withButton:(MouseButton)button andMask:(InputMask)mask {
    if (button != LeftButton)
        return;

    dragOrigin = pos;
    currentResizeHandle = [self boundingBoxResizeHandleAt:pos];
    [[renderer document] startChangeBoundingBox];
    if (currentResizeHandle == NoHandle) {
        drawingNewBox = YES;
        [[[renderer document] graph] setBoundingBox:NSZeroRect];
    } else {
        drawingNewBox = NO;
    }
    [renderer invalidateGraph];
}

- (void) mouseMoveTo:(NSPoint)pos withButtons:(MouseButton)buttons andMask:(InputMask)mask {
    if (!(buttons & LeftButton)) {
        ResizeHandle handle = [self boundingBoxResizeHandleAt:pos];
        [self setResizeCursorForHandle:handle];
        return;
    }

    Transformer *transformer = [renderer transformer];
    Grid *grid = [renderer grid];
    Graph *graph = [[renderer document] graph];

    if (currentResizeHandle == NoHandle) {
        NSRect bbox = NSRectAroundPoints(
            [grid snapScreenPoint:dragOrigin],
            [grid snapScreenPoint:pos]
        );
        [graph setBoundingBox:[transformer rectFromScreen:bbox]];
    } else {
        NSRect bbox = [transformer rectToScreen:[graph boundingBox]];
        NSPoint p2 = [grid snapScreenPoint:pos];

        if (currentResizeHandle == NorthWestHandle ||
                currentResizeHandle == NorthHandle ||
                currentResizeHandle == NorthEastHandle) {

                float dy = p2.y - NSMinY(bbox);
                if (dy < bbox.size.height) {
                    bbox.origin.y += dy;
                    bbox.size.height -= dy;
                } else {
                    bbox.origin.y = NSMaxY(bbox);
                    bbox.size.height = 0;
                }

        } else if (currentResizeHandle == SouthWestHandle ||
                currentResizeHandle == SouthHandle ||
                currentResizeHandle == SouthEastHandle) {

                float dy = p2.y - NSMaxY(bbox);
                if (-dy < bbox.size.height) {
                    bbox.size.height += dy;
                } else {
                    bbox.size.height = 0;
                }
        }

        if (currentResizeHandle == NorthWestHandle ||
                currentResizeHandle == WestHandle ||
                currentResizeHandle == SouthWestHandle) {

                float dx = p2.x - NSMinX(bbox);
                if (dx < bbox.size.width) {
                    bbox.origin.x += dx;
                    bbox.size.width -= dx;
                } else {
                    bbox.origin.x = NSMaxX(bbox);
                    bbox.size.width = 0;
                }

        } else if (currentResizeHandle == NorthEastHandle ||
                currentResizeHandle == EastHandle ||
                currentResizeHandle == SouthEastHandle) {

                float dx = p2.x - NSMaxX(bbox);
                if (-dx < bbox.size.width) {
                    bbox.size.width += dx;
                } else {
                    bbox.size.width = 0;
                }
        }
        [graph setBoundingBox:[transformer rectFromScreen:bbox]];
    }
    [[renderer document] changeBoundingBoxCheckPoint];
    [renderer invalidateGraph];
}

- (void) mouseReleaseAt:(NSPoint)pos withButton:(MouseButton)button andMask:(InputMask)mask {
    if (button != LeftButton)
        return;

    [[renderer document] endChangeBoundingBox];
    drawingNewBox = NO;
    [renderer invalidateGraph];
}

- (void) renderWithContext:(id<RenderContext>)context onSurface:(id<Surface>)surface {
    if (!drawingNewBox && [[[renderer document] graph] hasBoundingBox]) {
        [context saveState];

        [context setAntialiasMode:AntialiasDisabled];
        [context setLineWidth:1.0];

        [context startPath];
        [context rect:[self boundingBoxResizeHandleRect:EastHandle]];
        [context rect:[self boundingBoxResizeHandleRect:SouthEastHandle]];
        [context rect:[self boundingBoxResizeHandleRect:SouthHandle]];
        [context rect:[self boundingBoxResizeHandleRect:SouthWestHandle]];
        [context rect:[self boundingBoxResizeHandleRect:WestHandle]];
        [context rect:[self boundingBoxResizeHandleRect:NorthWestHandle]];
        [context rect:[self boundingBoxResizeHandleRect:NorthHandle]];
        [context rect:[self boundingBoxResizeHandleRect:NorthEastHandle]];
        [context strokePathWithColor:MakeSolidRColor (0.5, 0.5, 0.5)];

        [context restoreState];
    }
}
- (void) loadConfiguration:(Configuration*)config {}
- (void) saveConfiguration:(Configuration*)config {}
@end

@implementation BoundingBoxTool (Private)
- (NSRect) screenBoundingBox {
    Transformer *transformer = [[renderer surface] transformer];
    Graph *graph = [[renderer document] graph];
    return [transformer rectToScreen:[graph boundingBox]];
}

- (ResizeHandle) boundingBoxResizeHandleAt:(NSPoint)p {
    NSRect bbox = [self screenBoundingBox];
    if (p.x >= NSMaxX(bbox)) {
        if (p.x <= NSMaxX(bbox) + handle_size) {
            if (p.y >= NSMaxY(bbox)) {
                if (p.y <= NSMaxY(bbox) + handle_size) {
                    return SouthEastHandle;
                }
            } else if (p.y <= NSMinY(bbox)) {
                if (p.y >= NSMinY(bbox) - handle_size) {
                    return NorthEastHandle;
                }
            } else {
                float eastHandleTop = sideHandleTop(bbox);
                if (p.y >= eastHandleTop && p.y <= (eastHandleTop + handle_size)) {
                    return EastHandle;
                }
            }
        }
    } else if (p.x <= NSMinX(bbox)) {
        if (p.x >= NSMinX(bbox) - handle_size) {
            if (p.y >= NSMaxY(bbox)) {
                if (p.y <= NSMaxY(bbox) + handle_size) {
                    return SouthWestHandle;
                }
            } else if (p.y <= NSMinY(bbox)) {
                if (p.y >= NSMinY(bbox) - handle_size) {
                    return NorthWestHandle;
                }
            } else {
                float westHandleTop = sideHandleTop(bbox);
                if (p.y >= westHandleTop && p.y <= (westHandleTop + handle_size)) {
                    return WestHandle;
                }
            }
        }
    } else if (p.y >= NSMaxY(bbox)) {
        if (p.y <= NSMaxY(bbox) + handle_size) {
            float southHandleLeft = tbHandleLeft(bbox);
            if (p.x >= southHandleLeft && p.x <= (southHandleLeft + handle_size)) {
                return SouthHandle;
            }
        }
    } else if (p.y <= NSMinY(bbox)) {
        if (p.y >= NSMinY(bbox) - handle_size) {
            float northHandleLeft = tbHandleLeft(bbox);
            if (p.x >= northHandleLeft && p.x <= (northHandleLeft + handle_size)) {
                return NorthHandle;
            }
        }
    }
    return NoHandle;
}

- (NSRect) boundingBoxResizeHandleRect:(ResizeHandle)handle {
    Graph *graph = [[renderer document] graph];
    if (![graph hasBoundingBox]) {
        return NSZeroRect;
    }
    NSRect bbox = [self screenBoundingBox];
    float x;
    float y;
    switch (handle) {
        case NorthEastHandle:
        case EastHandle:
        case SouthEastHandle:
            x = NSMaxX(bbox);
            break;
        case NorthWestHandle:
        case WestHandle:
        case SouthWestHandle:
            x = NSMinX(bbox) - handle_size;
            break;
        case SouthHandle:
        case NorthHandle:
            x = tbHandleLeft(bbox);
            break;
        default:
            return NSZeroRect;
    }
    switch (handle) {
        case EastHandle:
        case WestHandle:
            y = sideHandleTop(bbox);
            break;
        case SouthEastHandle:
        case SouthHandle:
        case SouthWestHandle:
            y = NSMaxY(bbox);
            break;
        case NorthEastHandle:
        case NorthHandle:
        case NorthWestHandle:
            y = NSMinY(bbox) - handle_size;
            break;
        default:
            return NSZeroRect;
    }
    return NSMakeRect(x, y, handle_size, handle_size);
}

- (void) setResizeCursorForHandle:(ResizeHandle)handle {
    if (handle != currentResizeHandle) {
        currentResizeHandle = handle;
        Cursor c = NormalCursor;
        switch (handle) {
            case EastHandle:
                c = ResizeRightCursor;
                break;
            case SouthEastHandle:
                c = ResizeBottomRightCursor;
                break;
            case SouthHandle:
                c = ResizeBottomCursor;
                break;
            case SouthWestHandle:
                c = ResizeBottomLeftCursor;
                break;
            case WestHandle:
                c = ResizeLeftCursor;
                break;
            case NorthWestHandle:
                c = ResizeTopLeftCursor;
                break;
            case NorthHandle:
                c = ResizeTopCursor;
                break;
            case NorthEastHandle:
                c = ResizeTopRightCursor;
                break;
            default:
                c = NormalCursor;
                break;
        }
        [[renderer surface] setCursor:c];
    }
}
@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
