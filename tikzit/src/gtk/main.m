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
#import "logo.h"
#import "tzstockitems.h"

#import "Application.h"
#import "TikzGraphAssembler.h"

static GOptionEntry entries[] =
{
    //{ "verbose", 'v', 0, G_OPTION_ARG_NONE, &verbose, "Be verbose", NULL },
    { NULL }
};

void onUncaughtException(NSException* exception)
{
    NSLog(@"uncaught exception: %@", [exception description]);
}

int main (int argc, char *argv[]) {
    NSSetUncaughtExceptionHandler(&onUncaughtException);

    [[NSAutoreleasePool alloc] init];

    GError *error = NULL;
    GOptionContext *context;
    context = g_option_context_new ("[FILES] - PGF/TikZ-based graph editor");
    g_option_context_add_main_entries (context, entries, NULL);
    g_option_context_add_group (context, gtk_get_option_group (TRUE));
    if (!g_option_context_parse (context, &argc, &argv, &error))
    {
        if (error->domain == G_OPTION_ERROR) {
            g_print ("%s\nUse --help to see available options\n", error->message);
        } else {
            g_print ("Unexpected error parsing options: %s\n", error->message);
        }
        exit (1);
    }

#ifndef WINDOWS
    GList *icon_list = NULL;
    icon_list = g_list_prepend (icon_list, get_logo(LOGO_SIZE_128));
    icon_list = g_list_prepend (icon_list, get_logo(LOGO_SIZE_64));
    icon_list = g_list_prepend (icon_list, get_logo(LOGO_SIZE_48));
    icon_list = g_list_prepend (icon_list, get_logo(LOGO_SIZE_32));
    icon_list = g_list_prepend (icon_list, get_logo(LOGO_SIZE_24));
    icon_list = g_list_prepend (icon_list, get_logo(LOGO_SIZE_16));
    gtk_window_set_default_icon_list (icon_list);
    GList *list_head = icon_list;
    while (list_head) {
        g_object_unref ((GObject*)list_head->data);
        list_head = list_head->next;
    }
#endif

    NSAutoreleasePool *initPool = [[NSAutoreleasePool alloc] init];

    tz_register_stock_items();
    clipboard_init();
    [TikzGraphAssembler setup];

    Application *app = nil;
    if (argc > 1) {
        NSMutableArray *files = [NSMutableArray arrayWithCapacity:argc-1];
        for (int i = 1; i < argc; ++i) {
            [files insertObject:[NSString stringWithGlibFilename:argv[i]]
                        atIndex:i-1];
        }
        NSLog(@"Files: %@", files);
        app = [[Application alloc] initWithFiles:files];
    } else {
        app = [[Application alloc] init];
    }

    [initPool drain];

    gtk_main ();

    [app saveConfiguration];

    return 0;
}

// vim:ft=objc:et:sts=4:sw=4
