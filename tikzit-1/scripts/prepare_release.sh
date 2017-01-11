set -o errexit

PROJECT_NAME=TikZiT
APP_BUNDLE=xbuild/Release/$PROJECT_NAME.app

VERSION=$(defaults read "$(pwd)/$APP_BUNDLE/Contents/Info" CFBundleVersion)
DOWNLOAD_BASE_URL="http://tikzit.sourceforge.net/appcast"
RELEASENOTES_URL="$DOWNLOAD_BASE_URL/rnotes.html"

ARCHIVE_FILENAME="$PROJECT_NAME $VERSION.tar.bz2"
ARCHIVE_PATH="../www/htdocs/appcast/files/$ARCHIVE_FILENAME"
DOWNLOAD_URL="$DOWNLOAD_BASE_URL/files/$ARCHIVE_FILENAME"

if [ -e "$ARCHIVE_PATH" ]; then
  echo 'Archive already exists. Either remove this archive or increment version.'
  exit 1
fi

tar cjf "$ARCHIVE_PATH" "$APP_BUNDLE"

SIZE=$(stat -f %z "$ARCHIVE_PATH")
PUBDATE=$(LC_TIME=en_US date +"%a, %d %b %G %T %z")
SIGNATURE=$(scripts/sign_update.rb "$ARCHIVE_PATH" tikzit_dsa_priv.pem)

cat <<EOF
  <item>
    <title>Version $VERSION</title>
    <sparkle:releaseNotesLink>
      $RELEASENOTES_URL
    </sparkle:releaseNotesLink>
    <pubDate>$PUBDATE</pubDate>
    <enclosure
      url="$DOWNLOAD_URL"
      sparkle:version="$VERSION"
      type="application/octet-stream"
      length="$SIZE"
      sparkle:dsaSignature="$SIGNATURE"
    />
  </item>
EOF
