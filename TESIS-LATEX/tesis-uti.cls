%% ============================================================================
%%  tesis-uti.cls
%%  Clase para Trabajos de Titulación de la Universidad Tecnológica Indoamérica.
%%  Reproduce el formato del modelo "Tesis-AndresLopez": A4, TeX Gyre Adventor
%%  12 pt, márgenes de 30 mm, interlineado ~1.24, capítulos en romano,
%%  tablas y figuras con numeración corrida, ecuaciones II.1, anexos A–H.
%%
%%  Opciones:
%%     seccionesnumeradas   numera secciones/subsecciones como 3.2.1
%%                          (por defecto solo se numeran los capítulos)
%% ============================================================================
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{tesis-uti}[2026/09/20 v1.0 Trabajo de Titulacion UTI]

\newif\if@uti@secnum \@uti@secnumfalse
\DeclareOption{seccionesnumeradas}{\@uti@secnumtrue}
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{report}}
\ProcessOptions\relax
\LoadClass[12pt,a4paper]{report}

%% ---------------------------------------------------------------------------
%% Codificación, fuente e idioma
%% ---------------------------------------------------------------------------
\RequirePackage[T1]{fontenc}
\RequirePackage[utf8]{inputenc}
\RequirePackage{tgadventor}                 % TeX Gyre Adventor (Avant Garde)
\renewcommand{\familydefault}{\sfdefault}
\RequirePackage[spanish,es-tabla,es-nosectiondot]{babel}
\RequirePackage{microtype}
\RequirePackage{etoolbox}
\RequirePackage{calc}

%% ---------------------------------------------------------------------------
%% Página: A4, márgenes de 30 mm, número de página centrado al pie
%% ---------------------------------------------------------------------------
\RequirePackage[a4paper,left=30mm,right=30mm,top=30mm,bottom=32mm,
                footskip=14.8mm,nohead]{geometry}
\pagestyle{plain}

%% Interlineado (~1.24) y párrafos (sangría + 12 pt de separación)
\RequirePackage{setspace}
\setstretch{1.24}
\setlength{\parindent}{17.6pt}
\setlength{\parskip}{12pt}
\raggedbottom
\setlength{\emergencystretch}{3em}

%% ---------------------------------------------------------------------------
%% Paquetes de contenido
%% ---------------------------------------------------------------------------
\RequirePackage{graphicx}
\RequirePackage[table]{xcolor}
\RequirePackage{amsmath,amssymb}
\RequirePackage{array,multirow,tabularx,longtable,booktabs}
\RequirePackage{float}                      % [H] para tablas/figuras fijas
\RequirePackage{enumitem}
\RequirePackage{pdfpages}
\RequirePackage[group-separator={\,},group-minimum-digits=4,
                output-decimal-marker={.},detect-all]{siunitx}
\RequirePackage{listings}
\RequirePackage{url}
\RequirePackage{caption}
\RequirePackage{tikz}
\usetikzlibrary{arrows.meta,positioning,shapes.geometric,fit,calc,backgrounds}

%% ---------------------------------------------------------------------------
%% Numeración: capítulos en romano; tablas y figuras corridas; ecuaciones II.1
%% ---------------------------------------------------------------------------
\renewcommand{\thechapter}{\Roman{chapter}}
\counterwithout{table}{chapter}
\counterwithout{figure}{chapter}
\renewcommand{\thetable}{\arabic{table}}
\renewcommand{\thefigure}{\arabic{figure}}
\counterwithin{equation}{chapter}
\renewcommand{\theequation}{\thechapter.\arabic{equation}}

%% Nombres en español
\addto\captionsspanish{%
  \renewcommand{\contentsname}{Índice general}%
  \renewcommand{\listtablename}{Índice de Tablas}%
  \renewcommand{\listfigurename}{Índice de Figuras}%
  \renewcommand{\tablename}{Tabla}%
  \renewcommand{\figurename}{Figura}%
  \renewcommand{\bibname}{REFERENCIAS}%
}
\newcommand{\listequationname}{Índice de Ecuaciones}
\newcommand{\listanexoname}{Índice de Anexos}

%% ---------------------------------------------------------------------------
%% Encabezados de capítulo
%%   CAPÍTULO I
%%   INTRODUCCIÓN            (centrado, negrita, 17.2 pt, MAYÚSCULAS)
%% ---------------------------------------------------------------------------
\newcommand{\uti@chapskip}{1.5mm}     % espacio superior de la portadilla
\newcommand{\uti@chapsep}{21.5pt}      % entre "CAPÍTULO I" y el título
\newcommand{\uti@chapafter}{12.9mm}    % debajo del título

\newcommand{\uti@head}[2]{%          % #1 = primera línea, #2 = título
  \vspace*{\uti@chapskip}%
  {\parindent\z@\centering\normalfont\Large\bfseries
   \setstretch{1.24}%
   #1\par\nobreak
   \vskip\uti@chapsep
   \MakeUppercase{#2}\par\nobreak
   \vskip\uti@chapafter}}

\def\@makechapterhead#1{%
  \uti@head{\MakeUppercase{\chaptername}\ \thechapter}{#1}}
\def\@makeschapterhead#1{%
  \uti@head{\mbox{}}{#1}}

%% Capítulo sin número que sí aparece en el índice (REFERENCIAS, GLOSARIO)
\newcommand{\capitulosinnumero}[1]{%
  \chapter*{#1}%
  \phantomsection
  \addcontentsline{toc}{chapter}{\MakeUppercase{#1}}}

%% Referencias (IEEE): \imprimirreferencias{archivo-bib-sin-extension}
%% Genera el título REFERENCIAS (una sola vez, con entrada en el índice).
\AtBeginEnvironment{thebibliography}{%
  \setlength{\itemsep}{12pt}\setlength{\parsep}{0pt}}
\newcommand{\imprimirreferencias}[1]{%
  \clearpage
  \capitulosinnumero{Referencias}%
  \begingroup
    \def\chapter*##1{}%  el título ya se imprimió arriba
    \bibliographystyle{IEEEtran}%
    \bibliography{#1}%
  \endgroup}

%% ---------------------------------------------------------------------------
%% Secciones (titlesec)
%%   section       14.4 pt negrita        subsection     12 pt negrita
%%   subsubsection 12 pt negrita, sangrada y seguida de texto sin sangría
%% ---------------------------------------------------------------------------
\RequirePackage{titlesec}
\if@uti@secnum
  \setcounter{secnumdepth}{3}
  \renewcommand{\thesection}{\arabic{chapter}.\arabic{section}}
  \renewcommand{\thesubsection}{\thesection.\arabic{subsection}}
  \renewcommand{\thesubsubsection}{\thesubsection.\arabic{subsubsection}}
\else
  \setcounter{secnumdepth}{0}
\fi
\setcounter{tocdepth}{3}
\renewcommand*\l@subsubsection{\@dottedtocline{3}{4.7em}{3.2em}}

\titleformat{\section}{\normalfont\large\bfseries}{\thesection}{0.8em}{}
\titleformat{\subsection}{\normalfont\normalsize\bfseries}{\thesubsection}{0.8em}{}
\titlespacing{\section}{0pt}{9.2mm}{2.6mm}
\titlespacing{\subsection}{0pt}{7.2mm}{1.4mm}
%% Subsubsección: línea en negrita sangrada; el texto continúa debajo SIN
%% sangría (el asterisco de \titlespacing* suprime la sangría siguiente)
\titleformat{\subsubsection}[hang]{\normalfont\normalsize\bfseries}
  {\thesubsubsection}{0.8em}{}[\global\let\if@afterindent\iffalse]
\titlespacing*{\subsubsection}{\parindent}{0.9mm}{-5.3mm}

%% ---------------------------------------------------------------------------
%% Títulos de las páginas de índices (Índice general, de Tablas, de Figuras…)
%%   \Huge negrita alineado a la izquierda, como \chapter* de la clase report
%% ---------------------------------------------------------------------------
\newcommand{\uti@indextitle}[1]{%
  \clearpage
  \vspace*{9mm}%
  {\parindent\z@\normalfont\Huge\bfseries #1\par}\nobreak
  \vskip 14mm}

\newcommand{\uti@starttoc}[2]{%
  \uti@indextitle{#1}%
  \begingroup\setlength{\parskip}{0pt}\@starttoc{#2}\endgroup}
\renewcommand\tableofcontents{\uti@starttoc{\contentsname}{toc}}
\renewcommand\listoffigures{\uti@starttoc{\listfigurename}{lof}}
\renewcommand\listoftables{\uti@starttoc{\listtablename}{lot}}

%% Índice de ecuaciones: \eqindice{Título} dentro de la ecuación lo alimenta
\newcommand{\listofequations}{\uti@starttoc{\listequationname}{loe}}
\newcommand{\l@equation}{\@dottedtocline{1}{0em}{3.4em}}
\newcommand{\eqindice}[1]{%
  \addcontentsline{loe}{equation}{\protect\numberline{\theequation}#1}}

%% Índice de anexos
\newcommand{\listofanexos}{\uti@starttoc{\listanexoname}{loa}}
\newcommand{\l@anexo}{\@dottedtocline{1}{0em}{0em}}

%% ---------------------------------------------------------------------------
%% Anexos
%%   \anexo[archivo.pdf]{A}{Título del anexo}
%%   Genera la página divisoria "ANEXO A / TÍTULO" (con número de página),
%%   la registra en el índice general y en el índice de anexos, e incrusta
%%   el PDF (sin numerar) si se indica.
%% ---------------------------------------------------------------------------
\newcommand{\anexo}[3][]{%
  \clearpage
  \phantomsection
  \addcontentsline{toc}{chapter}{\protect\numberline{#2}#3}%
  \addcontentsline{loa}{anexo}{Anexo #2: #3}%
  \uti@head{ANEXO #2}{#3}%
  \clearpage
  \ifx\relax#1\relax\else
    \includepdf[pages=-,fitpaper=true]{#1}%
  \fi}

%% ---------------------------------------------------------------------------
%% Numeración de páginas: romana en preliminares, arábiga desde el capítulo I
%% (la numeración arábiga continúa —no se reinicia en 1—)
%% ---------------------------------------------------------------------------
\newcounter{uti@next}
\newcommand{\preliminares}{\clearpage\pagenumbering{roman}}
\newcommand{\cuerpoprincipal}{%
  \clearpage
  \setcounter{uti@next}{\value{page}}%
  \pagenumbering{arabic}%
  \setcounter{page}{\value{uti@next}}}

%% ---------------------------------------------------------------------------
%% Listas: viñeta cuadrada ▪, ítems separados como párrafos
%% ---------------------------------------------------------------------------
\setlist{topsep=6pt,partopsep=0pt,itemsep=12pt,parsep=0pt}
\setlist[itemize,1]{leftmargin=29pt,labelsep=9pt,labelwidth=5pt,
                    label=\raisebox{0.12ex}{\tiny$\blacksquare$}}
\setlist[itemize,2]{leftmargin=29pt,labelsep=9pt,labelwidth=5pt,
                    label=\raisebox{0.12ex}{\tiny$\blacksquare$}}
\setlist[enumerate,1]{leftmargin=29pt,labelsep=8pt,labelwidth=12pt,
                      label=\arabic*.,align=right}

%% ---------------------------------------------------------------------------
%% Leyendas: "Tabla N:" arriba, "Figura N:" abajo (etiqueta en negrita)
%% ---------------------------------------------------------------------------
\captionsetup{font=normalsize,labelfont=bf,labelsep=colon,
              justification=justified,singlelinecheck=false}
\captionsetup[table]{position=top,justification=raggedright,skip=8pt}
\captionsetup[longtable]{position=top,justification=raggedright,skip=8pt}
\captionsetup[figure]{position=bottom,skip=8pt}
%% Ancho de la leyenda dentro de longtable (si excede el de la tabla, la ensancha)
\setlength{\LTcapwidth}{11.5cm}
\setlength{\textfloatsep}{18pt plus 2pt minus 4pt}

%% Estilo base de tabla: rejilla fina gris, centrada
\AtBeginEnvironment{tabular}{\setlength{\parskip}{0pt}}
\AtBeginEnvironment{longtable}{\setlength{\parskip}{0pt}}
\newcommand{\tablabase}{\centering\arrayrulecolor{black!55}%
  \renewcommand{\arraystretch}{1.1}}
%% Celdas de encabezado: centradas y en negrita  \enc{Texto}
\newcommand{\enc}[1]{\multicolumn{1}{|c|}{\textbf{#1}}}
%% Encabezado de continuación en tablas largas (longtable)
\newcommand{\tablacont}[1]{%
  \multicolumn{#1}{c}{\normalfont Tabla~\thetable\ –\ Continuación de la página anterior}\\[6pt]}

%% Código en línea y bloques
\lstset{basicstyle=\ttfamily\small,breaklines=true,columns=fullflexible,
        keepspaces=true,showstringspaces=false,inputencoding=utf8,extendedchars=true,
        literate={á}{{\'a}}1 {é}{{\'e}}1 {í}{{\'i}}1 {ó}{{\'o}}1 {ú}{{\'u}}1
                 {ñ}{{\~n}}1 {Á}{{\'A}}1 {É}{{\'E}}1 {Í}{{\'I}}1 {Ó}{{\'O}}1
                 {Ú}{{\'U}}1 {Ñ}{{\~N}}1 {ü}{{\"u}}1 {¿}{{?`}}1 {¡}{{!`}}1
                 {–}{{--}}1 {—}{{---}}1 {≥}{{$\geq$}}1 {→}{{$\rightarrow$}}1}

%% ---------------------------------------------------------------------------
%% Glosario:  \begin{glosario} \termino{API}{Definición}  \end{glosario}
%% ---------------------------------------------------------------------------
\newenvironment{glosario}{%
  \begin{list}{}{\setlength{\leftmargin}{2.6em}\setlength{\itemindent}{-2.6em}%
    \setlength{\labelwidth}{0pt}\setlength{\labelsep}{0pt}%
    \setlength{\itemsep}{6pt}\setlength{\parsep}{0pt}\setlength{\topsep}{0pt}}}%
  {\end{list}}
\newcommand{\termino}[2]{\item \textbf{#1}\hspace{0.6em}#2}

%% ---------------------------------------------------------------------------
%% Elementos de las páginas preliminares
%% ---------------------------------------------------------------------------
\newcommand{\titulopreliminar}[1]{%
  {\centering\normalfont\bfseries\MakeUppercase{#1}\par}\vspace{6mm}}
\newcommand{\lineafirma}[1]{%
  \begin{center}\rule{62mm}{0.3pt}\\[2pt]#1\end{center}}

%% Marca de contenido pendiente (borrador): aparece en rojo y negrita.
%% Para la versión final basta redefinir \pend{#1}{} o buscar «PENDIENTE» y resolver.
\newcommand{\pend}[1]{\textcolor{red}{\textbf{[PENDIENTE: #1]}}}

%% Hiperenlaces (sin recuadros de color)
\RequirePackage[hidelinks,unicode]{hyperref}
\endinput
