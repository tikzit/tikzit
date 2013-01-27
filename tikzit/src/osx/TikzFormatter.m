//
//  NSTikzFormatter.m
//  TikZiT
//
//  Created by Karl Johan Paulsson on 27/01/2013.
//  Copyright (c) 2013 Aleks Kissinger. All rights reserved.
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

#import "TikzFormatter.h"
#import "TikzGraphAssembler.h"

@implementation TikzFormatter

- (NSString *)stringForObjectValue:(id)obj{    
    if (![obj isKindOfClass:[NSString class]]) {
        return @"";
    }
    
    return [NSString stringWithString:obj];
}

- (BOOL)getObjectValue:(out id *)obj forString:(NSString *)string errorDescription:(out NSString **)error{    
    *obj = [NSString stringWithString:string];
    
    TikzGraphAssembler *ass = [[TikzGraphAssembler alloc] init];
	BOOL r = [ass testTikz:string];
    
    if (!r && error)
        *error = NSLocalizedString(@"Invalid input, couldn't parse value.", @"tikz user input error");
    
    return r;
}

- (BOOL)isPartialStringValid:(NSString **)partialStringPtr proposedSelectedRange:(NSRangePointer)proposedSelRangePtr originalString:(NSString *)origString originalSelectedRange:(NSRange)origSelRange errorDescription:(NSString **)error{
    NSRange addedRange;
    NSString *addedString;
    
    addedRange = NSMakeRange(origSelRange.location, proposedSelRangePtr->location - origSelRange.location);
    addedString = [*partialStringPtr substringWithRange: addedRange];
    
    if([addedString isEqualToString:@"{"]){
        NSString *s = [[NSString stringWithString:*partialStringPtr] stringByAppendingString:@"}"];
        *partialStringPtr = s;
        
        return NO;
    }
    
    if([addedString isEqualToString:@"}"]){
        NSScanner *scanner = [NSScanner scannerWithString:*partialStringPtr];
        
        NSCharacterSet *cs = [NSCharacterSet characterSetWithCharactersInString:@"{}"];
        NSMutableString *strippedString = [NSMutableString stringWithCapacity:[*partialStringPtr length]];
        
        while ([scanner isAtEnd] == NO) {
            NSString *buffer;
            if ([scanner scanCharactersFromSet:cs intoString:&buffer]) {
                [strippedString appendString:buffer];
                
            } else {
                [scanner setScanLocation:([scanner scanLocation] + 1)];
            }
        }
        
        [cs autorelease];
        [scanner autorelease];
        [strippedString autorelease];
        
        if([strippedString length] % 2 == 1){
            return NO;
        }
    }
    
    return YES;
}

@end
