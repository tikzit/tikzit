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

#import "CreateEdgeTool.h"

#import "Configuration.h"
#import "EdgeStyleSelector.h"
#import "GraphRenderer.h"
#import "TikzDocument.h"
#import "tzstockitems.h"

@implementation CreateEdgeTool
- (NSString*) name { return @"Create Edge"; }
- (const gchar*) stockId { return TIKZIT_STOCK_CREATE_EDGE; }
- (NSString*) helpText { return @"Create new edges"; }
- (NSString*) shortcut { return @"e"; }
@synthesize activeRenderer=renderer;
@synthesize styleManager;
@synthesize configurationWidget=configWidget;

+ (id) toolWithStyleManager:(StyleManager*)sm {
    return [[[self alloc] initWithStyleManager:sm] autorelease];
}

- (id) init {
    [self release];
    return nil;
}

- (id) initWithStyleManager:(StyleManager*)sm {
    self = [super init];

    if (self) {
        styleManager = [sm retain];
        stylePicker = [[EdgeStyleSelector alloc] initWithStyleManager:sm];

        configWidget = gtk_vbox_new (FALSE, 0);
        g_object_ref_sink (configWidget);

        GtkWidget *label = gtk_label_new ("Edge style:");
        gtk_widget_show (label);
        gtk_misc_set_alignment (GTK_MISC (label), 0.0, 0.5);
        gtk_box_pack_start (GTK_BOX (configWidget),
                            label,
                            FALSE,
                            FALSE,
                            0);

        GtkWidget *selWindow = gtk_scrolled_window_new (NULL, NULL);
        gtk_widget_show (selWindow);
        gtk_container_add (GTK_CONTAINER (selWindow),
                           [stylePicker widget]);
        gtk_scrolled_window_set_policy (GTK_SCROLLED_WINDOW (selWindow),
                                        GTK_POLICY_NEVER,
                                        GTK_POLICY_AUTOMATIC);
        gtk_widget_show ([stylePicker widget]);

        GtkWidget *selectorFrame = gtk_frame_new (NULL);
        gtk_widget_show (selectorFrame);
        gtk_box_pack_start (GTK_BOX (configWidget),
                            selectorFrame,
                            TRUE,
                            TRUE,
                            0);
        gtk_container_add (GTK_CONTAINER (selectorFrame),
                           selWindow);
    }

    return self;
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];

    [renderer release];
    [styleManager release];
    [stylePicker release];
    [sourceNode release];

    g_object_unref (G_OBJECT (configWidget));

    [super dealloc];
}

- (EdgeStyle*) activeStyle {
    return [stylePicker selectedStyle];
}

- (void) setActiveStyle:(EdgeStyle*)style {
    return [stylePicker setSelectedStyle:style];
}

- (void) invalidateHalfEdge {
    NSRect invRect = NSRectAroundPoints(sourceNodeScreenPoint, halfEdgeEnd);
    [renderer invalidateRect:NSInsetRect (invRect, -2.0f, -2.0f)];
}

- (void) mousePressAt:(NSPoint)pos withButton:(MouseButton)button andMask:(InputMask)mask {
    if (button != LeftButton)
        return;

    sourceNode = [renderer anyNodeAt:pos];
    if (sourceNode != nil) {
        Transformer *transformer = [[renderer surface] transformer];
        sourceNodeScreenPoint = [transformer toScreen:[sourceNode point]];
        halfEdgeEnd = pos;
        [renderer setNode:sourceNode highlighted:YES];
    }
}

- (void) mouseMoveTo:(NSPoint)pos withButtons:(MouseButton)buttons andMask:(InputMask)mask {
    if (!(buttons & LeftButton))
        return;
    if (sourceNode == nil)
        return;

    [self invalidateHalfEdge];

    [renderer clearHighlightedNodes];
    [renderer setNode:sourceNode highlighted:YES];
    halfEdgeEnd = pos;
    Node *targ = [renderer anyNodeAt:pos];
    if (targ != nil) {
        [renderer setNode:targ highlighted:YES];
    }

    [self invalidateHalfEdge];
}

- (void) mouseReleaseAt:(NSPoint)pos withButton:(MouseButton)button andMask:(InputMask)mask {
    if (button != LeftButton)
        return;
    if (sourceNode == nil)
        return;

    [renderer clearHighlightedNodes];
    [self invalidateHalfEdge];

    Node *targ = [renderer anyNodeAt:pos];
    if (targ != nil) {
        Edge *edge = [Edge edgeWithSource:sourceNode andTarget:targ];
        [edge setStyle:[self activeStyle]];
        [[renderer document] addEdge:edge];
        [renderer invalidateEdge:edge];
    }

    sourceNode = nil;
}

- (void) renderWithContext:(id<RenderContext>)context onSurface:(id<Surface>)surface {
    if (sourceNode == nil) {
        return;
    }
    [context saveState];

    [context setLineWidth:1.0];
    [context startPath];
    [context moveTo:sourceNodeScreenPoint];
    [context lineTo:halfEdgeEnd];
    [context strokePathWithColor:MakeRColor (0, 0, 0, 0.5)];

    [context restoreState];
}

- (void) loadConfiguration:(Configuration*)config {
    NSString *styleName = [config stringEntry:@"ActiveStyle"
                                      inGroup:@"CreateEdgeTool"
                                  withDefault:nil];
    [self setActiveStyle:[styleManager edgeStyleForName:styleName]];
}

- (void) saveConfiguration:(Configuration*)config {
    [config setStringEntry:@"ActiveStyle"
                   inGroup:@"CreateEdgeTool"
                     value:[[self activeStyle] name]];
}
@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
