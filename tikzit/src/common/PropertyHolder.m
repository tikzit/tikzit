//
//  PropertyHolder.m
//  TikZiT
//  
//  Copyright 2011 Aleks Kissinger. All rights reserved.
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

#import "PropertyHolder.h"

@implementation PropertyHolder


- (id)init {
    [super init];
    notificationName = @"UnknownPropertyChanged";
    return self;
}

- (id)initWithNotificationName:(NSString*)n {
    [super init];
    notificationName = [n copy];
    return self;
}

- (void)postPropertyChanged:(NSString*)property oldValue:(id)value {
    NSDictionary *userInfo;
    if (value != nil) {
        userInfo = [NSDictionary dictionaryWithObjectsAndKeys:
                    property, @"propertyName",
                    value, @"oldValue",
                    nil];
    } else {
        userInfo = [NSDictionary dictionaryWithObject:property
                                               forKey:@"propertyName"];
    }
    [[NSNotificationCenter defaultCenter] postNotificationName:notificationName
                                                        object:self
                                                      userInfo:userInfo];
}

- (void)postPropertyChanged:(NSString*)property {
    [self postPropertyChanged:property oldValue:nil];
}

- (void)dealloc {
    [notificationName release];
    [super dealloc];
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
