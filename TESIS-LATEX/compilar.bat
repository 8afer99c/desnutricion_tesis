@echo off
rem Compila main.tex: pdflatex -> bibtex -> pdflatex x2
pdflatex -interaction=nonstopmode main.tex
bibtex main
pdflatex -interaction=nonstopmode main.tex
pdflatex -interaction=nonstopmode main.tex
echo.
echo Listo: main.pdf
pause
