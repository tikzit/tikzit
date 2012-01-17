OBJC = gcc -MMD -MP -DSTAND_ALONE -DGNUSTEP -DGNUSTEP_BASE_LIBRARY=1 -DGNU_RUNTIME=1 -DGNUSTEP_BASE_LIBRARY=1 -fno-strict-aliasing -fPIC -Wall -DGSWARN -DGSDIAGNOSE -Wno-import -O0 -g -pipe -Wall -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector --param=ssp-buffer-size=4 -m64 -mtune=generic -fgnu-runtime -fconstant-string-class=NSConstantString -I. -I.. -I/users/alemer/GNUstep/Library/Headers -std=c99 -D_GNU_SOURCE -rdynamic -fgnu-runtime -L/users/alemer/GNUstep/Library/Libraries -L/usr/local/lib64 -L/usr/lib64 -lgnustep-base -lpthread -lobjc -lm

maths_test_objects = test.m maths.m ../util.m
color_test_objects = test.m color.m ../ColorRGB.m ../util.m ../BasicMapTable.m ../RColor.m

test: maths-test color-test
	./maths-test
	./color-test

maths-test: $(maths_test_objects)
	$(OBJC) $(maths_test_objects) -o $@

color-test: $(color_test_objects)
	$(OBJC) $(color_test_objects) -o $@
