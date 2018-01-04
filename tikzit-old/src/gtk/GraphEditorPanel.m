/*
 * Copyright 2012  Alex Merry <alex.merry@kdemail.net>
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

#import "GraphEditorPanel.h"

#import "Application.h"
#import "GraphRenderer.h"
#import "HandTool.h"
#import "InputDelegate.h"
#import "TikzDocument.h"
#import "WidgetSurface.h"

#import <gdk/gdkkeysyms.h>

@class GraphRenderer;
@class WidgetSurface;

static const InputMask zoomPanMask = ControlMask;

/**
 * Mostly just a multiplexer, but also handles zoom and pan
 * when ctrl is held
 */
@interface GraphInputHandler : NSObject<InputDelegate> {
    GraphEditorPanel *panel;
    NSPoint           dragOrigin;
    NSPoint           oldGraphOrigin;
    BOOL              zoomPanActive;
}
- (id) initForPanel:(GraphEditorPanel*)p;
@end

@implementation GraphEditorPanel

@synthesize previewHandler;

- (id) init {
    return [self initWithDocument:nil];
}
- (id) initWithDocument:(TikzDocument*)document {
    self = [super init];
    if (self) {
        surface = [[WidgetSurface alloc] init];
        [surface setDefaultScale:50.0f];
        [surface setKeepCentered:YES];
        [surface setCanFocus:YES];
        renderer = [[GraphRenderer alloc] initWithSurface:surface document:document];

        inputHandler = [[GraphInputHandler alloc] initForPanel:self];
        [surface setInputDelegate:inputHandler];
    }
    return self;
}

- (void) dealloc {
    [renderer release];
    [surface release];
    [inputHandler release];

    [super dealloc];
}

- (GraphRenderer*) renderer {
    return renderer;
}
- (TikzDocument*) document {
    return [renderer document];
}
- (void) setDocument:(TikzDocument*)doc {
    [renderer setDocument:doc];
}
- (GtkWidget*) widget {
    return [surface widget];
}
- (id<Tool>) activeTool {
    return tool;
}
- (void) setActiveTool:(id<Tool>)t {
    if (t == tool)
        return;

    [[[renderer document] pickSupport] deselectAllNodes];
    [[[renderer document] pickSupport] deselectAllEdges];

    id oldTool = tool;
    BOOL weHadTool = ([oldTool activeRenderer] == renderer);
    if (weHadTool) {
        [oldTool setActiveRenderer:nil];
    }

    tool = [t retain];
    [oldTool release];

    if (weHadTool) {
        [self grabTool];
    }
}

- (BOOL) hasTool {
    return [tool activeRenderer] == renderer;
}

- (void) grabTool {
    if ([tool activeRenderer] != renderer) {
        [[tool activeRenderer] setPostRenderer:nil];
        [tool setActiveRenderer:renderer];
    }
    [renderer setPostRenderer:tool];
}

- (void) zoomInAboutPoint:(NSPoint)pos { [surface zoomInAboutPoint:pos]; }
- (void) zoomOutAboutPoint:(NSPoint)pos { [surface zoomOutAboutPoint:pos]; }
- (void) zoomIn { [surface zoomIn]; }
- (void) zoomOut { [surface zoomOut]; }
- (void) zoomReset { [surface zoomReset]; }

@end

@implementation GraphInputHandler
- (id) initForPanel:(GraphEditorPanel*)p {
    self = [super init];
    if (self) {
        // NB: no retention!
        panel = p;
    }
    return self;
}
- (id) init {
    [self release];
    return nil;
}
- (void) dealloc {
    [super dealloc];
}

// FIXME: share code with HandTool?
- (void) mousePressAt:(NSPoint)pos withButton:(MouseButton)button andMask:(InputMask)mask {
    if (mask == zoomPanMask && button == LeftButton) {
        dragOrigin = pos;
        oldGraphOrigin = [[[panel renderer] transformer] origin];
        zoomPanActive = YES;
    } else {
        zoomPanActive = NO;
        [panel grabTool];
        id<Tool> tool = [panel activeTool];
        if ([tool respondsToSelector:@selector(mousePressAt:withButton:andMask:)]) {
            [tool mousePressAt:pos withButton:button andMask:mask];
        }
    }
}

- (void) mouseDoubleClickAt:(NSPoint)pos withButton:(MouseButton)button andMask:(InputMask)mask {
    [panel grabTool];
    id<Tool> tool = [panel activeTool];
    if ([tool respondsToSelector:@selector(mouseDoubleClickAt:withButton:andMask:)]) {
        [tool mouseDoubleClickAt:pos withButton:button andMask:mask];
    }
}

- (void) mouseReleaseAt:(NSPoint)pos withButton:(MouseButton)button andMask:(InputMask)mask {
    if (zoomPanActive && button == LeftButton) {
        zoomPanActive = NO;
    } else if ([panel hasTool]) {
        id<Tool> tool = [panel activeTool];
        if ([tool respondsToSelector:@selector(mouseReleaseAt:withButton:andMask:)]) {
            [tool mouseReleaseAt:pos withButton:button andMask:mask];
        }
    }
}

- (void) mouseMoveTo:(NSPoint)pos withButtons:(MouseButton)buttons andMask:(InputMask)mask {
    if (zoomPanActive && (buttons & LeftButton)) {
        NSPoint newGraphOrigin = oldGraphOrigin;
        newGraphOrigin.x += pos.x - dragOrigin.x;
        newGraphOrigin.y += pos.y - dragOrigin.y;
        [[[panel renderer] transformer] setOrigin:newGraphOrigin];
        [[panel renderer] invalidateGraph];
    } else if ([panel hasTool]) {
        id<Tool> tool = [panel activeTool];
        if ([tool respondsToSelector:@selector(mouseMoveTo:withButtons:andMask:)]) {
            [tool mouseMoveTo:pos withButtons:buttons andMask:mask];
        }
    }
}

- (void) mouseScrolledAt:(NSPoint)pos inDirection:(ScrollDirection)dir withMask:(InputMask)mask {
    if (mask == zoomPanMask) {
        if (dir == ScrollUp) {
            [panel zoomInAboutPoint:pos];
        } else if (dir == ScrollDown) {
            [panel zoomOutAboutPoint:pos];
        }
    } else {
        id<Tool> tool = [panel activeTool];
        if ([panel hasTool] && [tool respondsToSelector:@selector(mouseScrolledAt:inDirection:withMask:)]) {
            [tool mouseScrolledAt:pos inDirection:dir withMask:mask];
        }
    }
}

- (void) keyPressed:(unsigned int)keyVal withMask:(InputMask)mask {
    if (keyVal == GDK_KEY_space && !mask) {
        return;
    }
    if (![app activateToolForKey:keyVal withMask:mask]) {
        id<Tool> tool = [panel activeTool];
        if ([panel hasTool] && [tool respondsToSelector:@selector(keyPressed:withMask:)]) {
            [tool keyPressed:keyVal withMask:mask];
        }
    }
}

- (void) keyReleased:(unsigned int)keyVal withMask:(InputMask)mask {
    if (keyVal == GDK_KEY_space && !mask) {
        [[panel previewHandler] showPreview];
    }
    if (![app activateToolForKey:keyVal withMask:mask]) {
        id<Tool> tool = [panel activeTool];
        if ([panel hasTool] && [tool respondsToSelector:@selector(keyReleased:withMask:)]) {
            [tool keyReleased:keyVal withMask:mask];
        }
    }
}
@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
