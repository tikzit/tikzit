//
//  main.m
//  TikZiT
//  
//  Copyright 2010 Chris Heunen. All rights reserved.
//  
//  
//  This file is part of TikZiT.
//  
//  TikZiT is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//  
//  TikZiT is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//  
//  You should have received a copy of the GNU General Public License
//  along with TikZiT.  If not, see <http://www.gnu.org/licenses/>.
//  

#import "TZFoundation.h"
#import <gtk/gtk.h>
#import "clipboard.h"

#import "MainWindow.h"
#import "TikzGraphAssembler.h"

void onUncaughtException(NSException* exception)
{
    NSLog(@"uncaught exception: %@", [exception description]);
}

int main (int argc, char *argv[]) {
    NSSetUncaughtExceptionHandler(&onUncaughtException);

    [[NSAutoreleasePool alloc] init];

    gtk_init (&argc, &argv);

    NSAutoreleasePool *initPool = [[NSAutoreleasePool alloc] init];

    clipboard_init();
    [TikzGraphAssembler setup];
    MainWindow *window = [[MainWindow alloc] init];

    [initPool drain];

    gtk_main ();

    [window saveConfiguration];

    return 0;
}

// vim:ft=objc:et:sts=4:sw=4
