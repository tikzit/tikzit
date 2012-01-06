/*
 * Copyright 2011  Alex Merry <alex.merry@kdemail.net>
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
#import "RenderContext.h"
#import "Transformer.h"
#import <cairo/cairo.h>
#import <pango/pango.h>
#import <gtk/gtk.h>

@interface PangoTextLayout: NSObject<TextLayout> {
    PangoLayout *layout;
    cairo_t *context;
}

+ (PangoTextLayout*) layoutForContext:(cairo_t*)cr withFontSize:(CGFloat)fontSize;
- (id) initWithContext:(cairo_t*)cr fontSize:(CGFloat)fontSize;
- (void) setText:(NSString*)text;

@end

@interface CairoRenderContext: NSObject<RenderContext> {
    cairo_t *context;
}

+ (CairoRenderContext*) contextForSurface:(cairo_surface_t*)surface;
- (id) initForSurface:(cairo_surface_t*)surface;

+ (CairoRenderContext*) contextForWidget:(GtkWidget*)widget;
- (id) initForWidget:(GtkWidget*)widget;

+ (CairoRenderContext*) contextForDrawable:(GdkDrawable*)d;
- (id) initForDrawable:(GdkDrawable*)d;

+ (CairoRenderContext*) contextForPixbuf:(GdkPixbuf*)buf;
- (id) initForPixbuf:(GdkPixbuf*)buf;

- (cairo_t*) cairoContext;
- (void) applyTransform:(Transformer*)transformer;

- (void) clearSurface;

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
