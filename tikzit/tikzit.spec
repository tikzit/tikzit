Name:           tikzit
Version:        1.0
Release:        1%{?dist}
Summary:        Tool for creating and modifying pgf/TikZ diagrams for TeX

# try to choose a sensible group for this distro
%if 0%{?suse_version}
Group:          Productivity/Graphics/Visualization/Graph
%else
%if 0%{?mdkversion}
Group:          Sciences/Other
%else
Group:          Applications/Productivity
%endif
%endif

License:        GPLv2+
URL:            http://tikzit.sourceforge.net
Source0:        http://switch.dl.sourceforge.net/project/%{name}/%{name}-%{version}/%{name}-%{version}.tar.bz2
BuildRoot:      %{_tmppath}/%{name}-%{version}-%{release}-build

BuildRequires:  gcc-objc >= 4.6.0
BuildRequires:  gnustep-base-devel >= 1.18.0
BuildRequires:  gtk2-devel >= 2.18.0
BuildRequires:  pango-devel >= 1.16
BuildRequires:  cairo-devel >= 1.4
%if 0%{?suse_version}%{?mdkversion}
BuildRequires:  libpoppler-glib-devel >= 0.10
%else
BuildRequires:  poppler-glib-devel >= 0.10
%endif
%if 0%{?suse_version}
BuildRequires:  update-desktop-files
%endif

%description
TikZiT is a GTK+ application that allows the creation and modification of TeX
diagrams written using the pgf/TikZ macro library. It is especially geared
toward rapidly creating "dot"-diagrams for use in academic papers.


%prep
%setup -q


%build
%configure
make %{?_smp_mflags}


%install
rm -rf %{buildroot}
make install DESTDIR=%{buildroot}
%if 0%{?suse_version}
# SuSE is particularly fussy about desktop file categories
%suse_update_desktop_file %{name} -r Graphics 2DGraphics
%endif


%clean
rm -rf %{buildroot}


%files
%defattr(-,root,root,-)
%doc
%{_bindir}/tikzit
%{_datadir}/tikzit/
%{_datadir}/applications/tikzit.desktop
%{_datadir}/icons/hicolor/*


%changelog
* Tue Dec 06 2011 Alex Merry <dev@randomguy3.me.uk> 1.0-1
-Bumped version
-Bumped requirements

* Tue Dec 06 2011 Alex Merry <dev@randomguy3.me.uk> 0.7-1
-Bumped version

* Tue Feb 08 2011 Alex Merry <dev@randomguy3.me.uk> 0.6-1
-Bumped version
-Added Pango and Cairo to BuildRequires
-Set minimum version for GNUStep-base

* Thu Dec 02 2010 Alex Merry <dev@randomguy3.me.uk> 0.5-1
-Rewrote spec file

