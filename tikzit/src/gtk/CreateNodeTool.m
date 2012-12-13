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

#import "CreateNodeTool.h"

#import "Configuration.h"
#import "GraphRenderer.h"
#import "NodeStyleSelector.h"
#import "TikzDocument.h"
#import "tzstockitems.h"

@implementation CreateNodeTool
- (NSString*) name { return @"Create Node"; }
- (const gchar*) stockId { return TIKZIT_STOCK_CREATE_NODE; }
- (NSString*) helpText { return @"Create new nodes"; }
- (NSString*) shortcut { return @"n"; }
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
        stylePicker = [[NodeStyleSelector alloc] initWithStyleManager:sm];

        configWidget = gtk_vbox_new (FALSE, 0);
        g_object_ref_sink (configWidget);

        GtkWidget *label = gtk_label_new ("Node style:");
        gtk_widget_show (label);
        gtk_misc_set_alignment (GTK_MISC (label), 0.0, 0.5);
        gtk_box_pack_start (GTK_BOX (configWidget),
                            label,
                            FALSE,
                            FALSE,
                            0);

        GtkWidget *selectorFrame = gtk_frame_new (NULL);
        gtk_widget_show (selectorFrame);
        gtk_box_pack_start (GTK_BOX (configWidget),
                            selectorFrame,
                            TRUE,
                            TRUE,
                            0);
        gtk_container_add (GTK_CONTAINER (selectorFrame),
                           [stylePicker widget]);
        gtk_widget_show ([stylePicker widget]);
    }

    return self;
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];

    [renderer release];
    [styleManager release];
    [stylePicker release];

    g_object_unref (G_OBJECT (configWidget));

    [super dealloc];
}

- (NodeStyle*) activeStyle {
    return [stylePicker selectedStyle];
}

- (void) setActiveStyle:(NodeStyle*)style {
    return [stylePicker setSelectedStyle:style];
}

// FIXME: create node on press, and drag it around?
- (void) mousePressAt:(NSPoint)pos withButton:(MouseButton)button andMask:(InputMask)mask {}

- (void) mouseReleaseAt:(NSPoint)pos withButton:(MouseButton)button andMask:(InputMask)mask {
    if (button != LeftButton)
        return;

    Transformer *transformer = [renderer transformer];
    NSPoint nodePoint = [transformer fromScreen:[[renderer grid] snapScreenPoint:pos]];
    Node *node = [Node nodeWithPoint:nodePoint];
    [node setStyle:[self activeStyle]];
    [[renderer document] addNode:node];
}

- (void) renderWithContext:(id<RenderContext>)context onSurface:(id<Surface>)surface {}

- (void) loadConfiguration:(Configuration*)config {
    NSString *styleName = [config stringEntry:@"ActiveStyle"
                                      inGroup:@"CreateNodeTool"
                                  withDefault:nil];
    [self setActiveStyle:[styleManager nodeStyleForName:styleName]];
}

- (void) saveConfiguration:(Configuration*)config {
    [config setStringEntry:@"ActiveStyle"
                   inGroup:@"CreateNodeTool"
                     value:[[self activeStyle] name]];
}
@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
