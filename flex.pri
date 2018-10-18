flex.name = Flex ${QMAKE_FILE_IN}
flex.input = FLEXSOURCES
flex.output = ${QMAKE_FILE_PATH}/${QMAKE_FILE_BASE}.lexer.cpp

win32 {
    flex.commands = win_flex.exe --header-file -o ${QMAKE_FILE_PATH}/${QMAKE_FILE_BASE}.lexer.cpp ${QMAKE_FILE_IN}
} else {
    flex.commands = flex --header-file -o ${QMAKE_FILE_PATH}/${QMAKE_FILE_BASE}.lexer.cpp ${QMAKE_FILE_IN}
}

flex.CONFIG += target_predeps
flex.variable_out = GENERATED_SOURCES
silent:flex.commands = @echo Lex ${QMAKE_FILE_IN} && $$flex.commands
QMAKE_EXTRA_COMPILERS += flex
