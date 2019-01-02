/*
    TikZiT - a GUI diagram editor for TikZ
    Copyright (C) 2018 Aleks Kissinger

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/*!
  * A string validator which keeps curly braces matched. Used in various places
  * to ensure the user doesn't make non-parseable .tikz or .tikzstyles files.
  *
  * Its validation function will return Acceptable if all curly braces are matched
  * properly, Intermediate if all braces are matched except for possibly some opening
  * curly braces, and Invalid if there are unmatched closing curly braces.
  */

#ifndef DELIMITEDSTRINGVALIDATOR_H
#define DELIMITEDSTRINGVALIDATOR_H


#include <QObject>
#include <QValidator>


class DelimitedStringValidator : public QValidator
{
public:
    DelimitedStringValidator(QObject *parent);
    QValidator::State validate(QString &input, int &/*pos*/) const override;

    /*!
     * \brief fixup adds curly braces until all braces are matched (if possible)
     * \param input
     */
    void fixup(QString &input) const override;
private:
    /*!
     * \brief braceDepth computes the final (non-escaped) curly-brace depth of a given string
     * \param input a string
     * \return the final brace depth, or -1 if the depth *ever* drops below 0
     */
    int braceDepth(QString input) const;
};

#endif // DELIMITEDSTRINGVALIDATOR_H
