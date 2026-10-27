FROM oven/bun:1.3.8-debian AS bun

FROM debian:trixie
ARG CHROMIUM=153.0.8010.52-1~deb13u1
ARG SNAPSHOT=https://snapshot.debian.org/archive/debian-security/20260920T000437Z/pool/updates/main/c/chromium
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl caddy libnss3-tools fonts-liberation fonts-noto-color-emoji \
  && arch=$(dpkg --print-architecture) && cd /tmp \
  && curl -fsSLO "$SNAPSHOT/chromium_${CHROMIUM}_${arch}.deb" && curl -fsSLO "$SNAPSHOT/chromium-common_${CHROMIUM}_${arch}.deb" \
  && apt-get install -y --no-install-recommends ./chromium_*.deb ./chromium-common_*.deb \
  && rm -rf /tmp/*.deb /var/lib/apt/lists/*
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /opt/psi
RUN echo '{"type":"module","dependencies":{"lighthouse":"13.5.0"}}' > package.json && bun install
COPY lh.ts /opt/psi/lh.ts
ENV CHROME_PATH=/usr/bin/chromium
