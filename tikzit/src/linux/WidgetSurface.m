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

#import "WidgetSurface.h"
#import "gtkhelpers.h"
#import "InputDelegate.h"
#import "CairoRenderContext.h"

// {{{ Internal interfaces
// {{{ GTK+ callbacks
static gboolean configure_event_cb (GtkWidget *widget, GdkEventConfigure *event, WidgetSurface *surface);
static void realize_cb (GtkWidget *widget, WidgetSurface *surface);
static gboolean expose_event_cb (GtkWidget *widget, GdkEventExpose *event, WidgetSurface *surface);
static gboolean button_press_event_cb (GtkWidget *widget, GdkEventButton *event, WidgetSurface *surface);
static gboolean button_release_event_cb (GtkWidget *widget, GdkEventButton *event, WidgetSurface *surface);
static gboolean motion_notify_event_cb (GtkWidget *widget, GdkEventMotion *event, WidgetSurface *surface);
static gboolean key_press_event_cb (GtkWidget *widget, GdkEventKey *event, WidgetSurface *surface);
static gboolean key_release_event_cb (GtkWidget *widget, GdkEventKey *event, WidgetSurface *surface);
static gboolean scroll_event_cb (GtkWidget *widget, GdkEventScroll *event, WidgetSurface *surface);
// }}}

@interface WidgetSurface (Private)
- (void) updateTransformer;
- (void) widgetSizeChanged:(NSNotification*)notification;
- (void) handleExposeEvent:(GdkEventExpose*)event;
- (void) updateLastKnownSize;
- (void) zoomTo:(CGFloat)scale aboutPoint:(NSPoint)p;
- (void) zoomTo:(CGFloat)scale;
@end
// }}}
// {{{ API
@implementation WidgetSurface

- (id) init {
    return [self initWithWidget:gtk_drawing_area_new ()];
}

- (id) initWithWidget:(GtkWidget*)w {
    self = [super init];

    if (self) {
        widget = w;
        g_object_ref_sink (G_OBJECT (widget));
        renderDelegate = nil;
        inputDelegate = nil;
        keepCentered = NO;
        grabsFocusOnClick = NO;
        defaultScale = 1.0f;
        transformer = [[Transformer alloc] init];
        [transformer setFlippedAboutXAxis:YES];
        [self updateLastKnownSize];
        g_object_set (G_OBJECT (widget), "events", GDK_STRUCTURE_MASK, NULL);
        g_signal_connect (widget, "expose-event", G_CALLBACK (expose_event_cb), self);
        g_signal_connect (widget, "configure-event", G_CALLBACK (configure_event_cb), self);
        g_signal_connect (widget, "realize", G_CALLBACK (realize_cb), self);
        g_signal_connect (widget, "button-press-event", G_CALLBACK (button_press_event_cb), self);
        g_signal_connect (widget, "button-release-event", G_CALLBACK (button_release_event_cb), self);
        g_signal_connect (widget, "motion-notify-event", G_CALLBACK (motion_notify_event_cb), self);
        g_signal_connect (widget, "key-press-event", G_CALLBACK (key_press_event_cb), self);
        g_signal_connect (widget, "key-release-event", G_CALLBACK (key_release_event_cb), self);
        g_signal_connect (widget, "scroll-event", G_CALLBACK (scroll_event_cb), self);
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(widgetSizeChanged:)
                                                     name:@"SurfaceSizeChanged"
                                                   object:self];
    }

    return self;
}

- (void) invalidateRect:(NSRect)rect {
    if (!NSIsEmptyRect (rect)) {
        GdkWindow *window = gtk_widget_get_window (widget);
        if (window) {
            GdkRectangle g_rect = gdk_rectangle_from_ns_rect (rect);
            gdk_window_invalidate_rect (window, &g_rect, TRUE);
        }
    }
}

- (void) invalidate {
    GdkWindow *window = gtk_widget_get_window (widget);
    if (window) {
        GdkRegion *visible = gdk_drawable_get_visible_region (GDK_DRAWABLE (window));
        gdk_window_invalidate_region (window, visible, TRUE);
        gdk_region_destroy (visible);
    }
}

- (id<RenderContext>) createRenderContext {
    return [CairoRenderContext contextForWidget:widget];
}

- (int) width {
    int width = 0;
    GdkWindow *window = gtk_widget_get_window (widget);
    if (window) {
        gdk_drawable_get_size (window, &width, NULL);
    }
    return width;
}

- (int) height {
    int height = 0;
    GdkWindow *window = gtk_widget_get_window (widget);
    if (window) {
        gdk_drawable_get_size (window, NULL, &height);
    }
    return height;
}

- (void) setSizeRequestWidth:(double)width height:(double)height {
    gtk_widget_set_size_request (widget, width, height);
}

- (Transformer*) transformer {
    return transformer;
}

- (GtkWidget*) widget {
    return widget;
}

- (void) addToEventMask:(GdkEventMask)value {
    GdkEventMask mask;
    g_object_get (G_OBJECT (widget), "events", &mask, NULL);
    mask |= value;
    g_object_set (G_OBJECT (widget), "events", mask, NULL);
}

- (void) removeFromEventMask:(GdkEventMask)value {
    GdkEventMask mask;
    g_object_get (G_OBJECT (widget), "events", &mask, NULL);
    mask ^= value;
    if (grabsFocusOnClick) {
        mask |= GDK_BUTTON_PRESS_MASK;
    }
    g_object_set (G_OBJECT (widget), "events", mask, NULL);
}

- (void) setRenderDelegate:(id <RenderDelegate>)delegate {
    // NB: no retention!
    renderDelegate = delegate;
    if (renderDelegate == nil) {
        [self removeFromEventMask:GDK_EXPOSURE_MASK];
    } else {
        [self addToEventMask:GDK_EXPOSURE_MASK];
    }
}

- (id) inputDelegate {
    return inputDelegate;
}

- (void) setInputDelegate:(id)delegate {
    if (delegate == inputDelegate) {
        return;
    }
    if (inputDelegate != nil) {
        [self removeFromEventMask:GDK_POINTER_MOTION_MASK
                                  | GDK_BUTTON_PRESS_MASK
                                  | GDK_BUTTON_RELEASE_MASK
                                  | GDK_KEY_PRESS_MASK
                                  | GDK_KEY_RELEASE_MASK];
    }
    inputDelegate = delegate;
    if (delegate != nil) {
        GdkEventMask mask = 0;
        if ([delegate respondsToSelector:@selector(mousePressAt:withButton:andMask:)]) {
            mask |= GDK_BUTTON_PRESS_MASK;
        }
        if ([delegate respondsToSelector:@selector(mouseReleaseAt:withButton:andMask:)]) {
            mask |= GDK_BUTTON_RELEASE_MASK;
        }
        if ([delegate respondsToSelector:@selector(mouseDoubleClickAt:withButton:andMask:)]) {
            mask |= GDK_BUTTON_PRESS_MASK;
        }
        if ([delegate respondsToSelector:@selector(mouseMoveTo:withButtons:andMask:)]) {
            mask |= GDK_POINTER_MOTION_MASK;
        }
        if ([delegate respondsToSelector:@selector(keyPressed:withMask:)]) {
            mask |= GDK_KEY_PRESS_MASK;
        }
        if ([delegate respondsToSelector:@selector(keyReleased:withMask:)]) {
            mask |= GDK_KEY_RELEASE_MASK;
        }
        [self addToEventMask:mask];
    }
}

- (id <RenderDelegate>) renderDelegate {
    return renderDelegate;
}

- (void) setKeepCentered:(BOOL)centered {
    keepCentered = centered;
    [self updateTransformer];
}

- (BOOL) keepCentered {
    return keepCentered;
}

- (BOOL) grabsFocusOnClick {
    return grabsFocusOnClick;
}

- (void) setGrabsFocusOnClick:(BOOL)focus {
    if (grabsFocusOnClick != focus) {
        grabsFocusOnClick = focus;
        if (grabsFocusOnClick) {
            [self addToEventMask:GDK_BUTTON_PRESS_MASK];
        } else {
            [self removeFromEventMask:GDK_BUTTON_PRESS_MASK];
        }
    }
}

- (CGFloat) defaultScale {
    return defaultScale;
}

- (void) setDefaultScale:(CGFloat)newDefault {
    if (defaultScale != newDefault) {
        CGFloat oldDefault = defaultScale;
        defaultScale = newDefault;

        CGFloat scale = [transformer scale];
        scale *= (newDefault / oldDefault);
        [transformer setScale:scale];
        [self invalidate];
    }
}

- (void) zoomIn {
    CGFloat scale = [transformer scale];
    scale *= 1.2f;
    [self zoomTo:scale];
}

- (void) zoomOut {
    CGFloat scale = [transformer scale];
    scale /= 1.2f;
    [self zoomTo:scale];
}

- (void) zoomReset {
    [self zoomTo:defaultScale];
}

- (void) zoomInAboutPoint:(NSPoint)p {
    CGFloat scale = [transformer scale];
    scale *= 1.2f;
    [self zoomTo:scale aboutPoint:p];
}

- (void) zoomOutAboutPoint:(NSPoint)p {
    CGFloat scale = [transformer scale];
    scale /= 1.2f;
    [self zoomTo:scale aboutPoint:p];
}

- (void) zoomResetAboutPoint:(NSPoint)p {
    [self zoomTo:defaultScale aboutPoint:p];
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    [transformer release];
    g_object_unref (G_OBJECT (widget));

    [super dealloc];
}

@end
// }}}
// {{{ Private
@implementation WidgetSurface (Private)
- (void) widgetSizeChanged:(NSNotification*)notification {
    [self updateTransformer];
    [self updateLastKnownSize];
}

- (void) updateTransformer {
    if (keepCentered) {
        GdkWindow *window = gtk_widget_get_window (widget);
        if (window) {
            int width = 0;
            int height = 0;
            gdk_drawable_get_size (window, &width, &height);
            NSPoint origin;
            if (lastKnownSize.width < 1 || lastKnownSize.height < 1) {
                origin.x = (float)width / 2.0f;
                origin.y = (float)height / 2.0f;
            } else {
                origin = [transformer origin];
                origin.x += ((float)width - lastKnownSize.width) / 2.0f;
                origin.y += ((float)height - lastKnownSize.height) / 2.0f;
            }
            [transformer setOrigin:origin];
        }
    }
}

- (void) handleExposeEvent:(GdkEventExpose*)event {
    if (renderDelegate != nil) {
        NSRect area = gdk_rectangle_to_ns_rect (event->area);

        id<RenderContext> context = [CairoRenderContext contextForWidget:widget];
        [context rect:area];
        [context clipToPath];
        [renderDelegate renderWithContext:context onSurface:self];
    }
}

- (void) updateLastKnownSize {
    GdkWindow *window = gtk_widget_get_window (widget);
    if (window) {
        int width = 0;
        int height = 0;
        gdk_drawable_get_size (window, &width, &height);
        lastKnownSize.width = (float)width;
        lastKnownSize.height = (float)height;
    } else {
        lastKnownSize = NSZeroSize;
    }
}

- (void) zoomTo:(CGFloat)scale aboutPoint:(NSPoint)p {
    NSPoint graphP = [transformer fromScreen:p];

    [transformer setScale:scale];

    NSPoint newP = [transformer toScreen:graphP];
    NSPoint origin = [transformer origin];
    origin.x += p.x - newP.x;
    origin.y += p.y - newP.y;
    [transformer setOrigin:origin];

    [self invalidate];
}

- (void) zoomTo:(CGFloat)scale {
    NSPoint centre = NSMakePoint (lastKnownSize.width/2.0f, lastKnownSize.height/2.0f);
    [self zoomTo:scale aboutPoint:centre];
}

@end
// }}}
// {{{ GTK+ callbacks
static gboolean configure_event_cb(GtkWidget *widget, GdkEventConfigure *event, WidgetSurface *surface) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [[NSNotificationCenter defaultCenter] postNotificationName:@"SurfaceSizeChanged" object:surface];
    [pool drain];
    return FALSE;
}

static void realize_cb (GtkWidget *widget, WidgetSurface *surface) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [surface updateTransformer];
    [pool drain];
}

static gboolean expose_event_cb(GtkWidget *widget, GdkEventExpose *event, WidgetSurface *surface) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [surface handleExposeEvent:event];
    [pool drain];
    return FALSE;
}

InputMask mask_from_gdk_modifier_state (GdkModifierType state) {
    InputMask mask = 0;
    if (state & GDK_SHIFT_MASK) {
        mask |= ShiftMask;
    }
    if (state & GDK_CONTROL_MASK) {
        mask |= ControlMask;
    }
    if (state & GDK_META_MASK) {
        mask |= MetaMask;
    }
    return mask;
}

ScrollDirection scroll_dir_from_gdk_scroll_dir (GdkScrollDirection dir) {
    switch (dir) {
        case GDK_SCROLL_UP: return ScrollUp;
        case GDK_SCROLL_DOWN: return ScrollDown;
        case GDK_SCROLL_LEFT: return ScrollLeft;
        case GDK_SCROLL_RIGHT: return ScrollRight;
        default: NSLog(@"Invalid scroll direction %i", (int)dir); return ScrollDown;
    }
}

MouseButton buttons_from_gdk_modifier_state (GdkModifierType state) {
    MouseButton buttons = 0;
    if (state & GDK_BUTTON1_MASK) {
        buttons |= LeftButton;
    }
    if (state & GDK_BUTTON2_MASK) {
        buttons |= MiddleButton;
    }
    if (state & GDK_BUTTON3_MASK) {
        buttons |= RightButton;
    }
    if (state & GDK_BUTTON4_MASK) {
        buttons |= Button4;
    }
    if (state & GDK_BUTTON5_MASK) {
        buttons |= Button5;
    }
    return buttons;
}

static gboolean button_press_event_cb(GtkWidget *widget, GdkEventButton *event, WidgetSurface *surface) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    if ([surface grabsFocusOnClick]) {
        if (!GTK_WIDGET_HAS_FOCUS (widget)) {
             gtk_widget_grab_focus (widget);
        }
    }

    id delegate = [surface inputDelegate];
    if (delegate != nil) {
        NSPoint pos = NSMakePoint (event->x, event->y);
        MouseButton button = (MouseButton)event->button;
        InputMask mask = mask_from_gdk_modifier_state (event->state);
        if (event->type == GDK_BUTTON_PRESS && [delegate respondsToSelector:@selector(mousePressAt:withButton:andMask:)]) {
            [delegate mousePressAt:pos withButton:button andMask:mask];
        }
        if (event->type == GDK_2BUTTON_PRESS && [delegate respondsToSelector:@selector(mouseDoubleClickAt:withButton:andMask:)]) {
            [delegate mouseDoubleClickAt:pos withButton:button andMask:mask];
        }
    }

    [pool drain];
    return FALSE;
}

static gboolean button_release_event_cb(GtkWidget *widget, GdkEventButton *event, WidgetSurface *surface) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    id delegate = [surface inputDelegate];
    if (delegate != nil) {
        if ([delegate respondsToSelector:@selector(mouseReleaseAt:withButton:andMask:)]) {
            NSPoint pos = NSMakePoint (event->x, event->y);
            MouseButton button = (MouseButton)event->button;
            InputMask mask = mask_from_gdk_modifier_state (event->state);
            [delegate mouseReleaseAt:pos withButton:button andMask:mask];
        }
    }

    [pool drain];
    return FALSE;
}

static gboolean motion_notify_event_cb(GtkWidget *widget, GdkEventMotion *event, WidgetSurface *surface) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    id delegate = [surface inputDelegate];
    if (delegate != nil) {
        if ([delegate respondsToSelector:@selector(mouseMoveTo:withButtons:andMask:)]) {
            NSPoint pos = NSMakePoint (event->x, event->y);
            MouseButton buttons = buttons_from_gdk_modifier_state (event->state);
            InputMask mask = mask_from_gdk_modifier_state (event->state);
            [delegate mouseMoveTo:pos withButtons:buttons andMask:mask];
        }
    }

    [pool drain];
    return FALSE;
}

static gboolean key_press_event_cb(GtkWidget *widget, GdkEventKey *event, WidgetSurface *surface) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    id delegate = [surface inputDelegate];
    if (delegate != nil) {
        if ([delegate respondsToSelector:@selector(keyPressed:withMask:)]) {
            InputMask mask = mask_from_gdk_modifier_state (event->state);
            [delegate keyPressed:event->keyval withMask:mask];
        }
    }

    [pool drain];
    return FALSE;
}

static gboolean key_release_event_cb(GtkWidget *widget, GdkEventKey *event, WidgetSurface *surface) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    id delegate = [surface inputDelegate];
    if (delegate != nil) {
        if ([delegate respondsToSelector:@selector(keyReleased:withMask:)]) {
            InputMask mask = mask_from_gdk_modifier_state (event->state);
            [delegate keyReleased:event->keyval withMask:mask];
        }
    }

    [pool drain];
    return FALSE;
}

static gboolean scroll_event_cb (GtkWidget *widget, GdkEventScroll *event, WidgetSurface *surface) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    id delegate = [surface inputDelegate];
    if (delegate != nil) {
        if ([delegate respondsToSelector:@selector(mouseScrolledAt:inDirection:withMask:)]) {
            NSPoint pos = NSMakePoint (event->x, event->y);
            InputMask mask = mask_from_gdk_modifier_state (event->state);
            ScrollDirection dir = scroll_dir_from_gdk_scroll_dir (event->direction);
            [delegate mouseScrolledAt:pos
                          inDirection:dir
                             withMask:mask];
        }
    }

    [pool drain];
    return FALSE;
}
// }}}

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
