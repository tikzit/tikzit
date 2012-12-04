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

#import "TZFoundation.h"
#import <gtk/gtk.h>
#import <InputDelegate.h>
#import <Surface.h>

/**
 * Provides a surface for rendering to a widget.
 */
@interface WidgetSurface: NSObject <Surface> {
    GtkWidget           *widget;
    Transformer         *transformer;
    id <RenderDelegate>  renderDelegate;
    id <InputDelegate>   inputDelegate;
    BOOL                 keepCentered;
    BOOL                 grabsFocusOnClick;
    CGFloat              defaultScale;
    NSSize               lastKnownSize;
}

- (id) initWithWidget:(GtkWidget*)widget;
- (GtkWidget*) widget;

- (id<InputDelegate>) inputDelegate;
- (void) setInputDelegate:(id<InputDelegate>)delegate;

- (BOOL) keepCentered;
- (void) setKeepCentered:(BOOL)centered;

- (BOOL) grabsFocusOnClick;
- (void) setGrabsFocusOnClick:(BOOL)focusOnClick;

- (CGFloat) defaultScale;
- (void) setDefaultScale:(CGFloat)scale;

/**
 * Set the minimum size that this widget wants
 */
- (void) setSizeRequestWidth:(double)width height:(double)height;

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
