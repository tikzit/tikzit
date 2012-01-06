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

typedef enum {
    LeftButton = 1,
    MiddleButton = 2,
    RightButton = 3,
    Button4 = 4,
    Button5 = 5
} MouseButton;

typedef enum {
    ShiftMask = 1,
    ControlMask = 2,
    MetaMask = 4
} InputMask;

typedef enum {
    ScrollUp = 1,
    ScrollDown = 2,
    ScrollLeft = 3,
    ScrollRight = 4,
} ScrollDirection;

@interface NSObject (InputDelegate)
/**
 * A mouse button was pressed.
 */
- (void) mousePressAt:(NSPoint)pos withButton:(MouseButton)button andMask:(InputMask)mask;
/**
 * A mouse button was released.
 */
- (void) mouseReleaseAt:(NSPoint)pos withButton:(MouseButton)button andMask:(InputMask)mask;
/**
 * A mouse button was double-clicked.
 *
 * Note that mouseDown and mouseUp events will still be delivered.
 * This will be triggered between the second mouseDown and the second
 * mouseUp.
 */
- (void) mouseDoubleClickAt:(NSPoint)pos withButton:(MouseButton)button andMask:(InputMask)mask;
/**
 * The mouse was moved
 */
- (void) mouseMoveTo:(NSPoint)pos withButtons:(MouseButton)button andMask:(InputMask)mask;
/**
 * The mouse was scrolled
 */
- (void) mouseScrolledAt:(NSPoint)pos inDirection:(ScrollDirection)dir withMask:(InputMask)mask;
/**
 * A key was pressed
 */
- (void) keyPressed:(unsigned int)keyVal withMask:(InputMask)mask;
/**
 * A key was released
 */
- (void) keyReleased:(unsigned int)keyVal withMask:(InputMask)mask;
@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
