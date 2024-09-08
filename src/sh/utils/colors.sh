#!/bin/bash

# All functions in this file are intended to be
# sourced by other scripts, for example:
#   source src/sh/utils/colors.sh
#   log_info "This is an info message"
#   log_warning "This is a warning message"

ESCAPE_SEQ='\033'

style() {
	local style="$1"
	echo "$ESCAPE_SEQ[$style"
}

# Color definitions
BOLD_TEXT=$(style "1m")
HIGHLIGHT_COLOR=$(style "38;5;221m")
INFO_COLOR=$(style "38;5;115m")
ERROR_COLOR=$(style "38;5;009m")
WARNING_COLOR=$(style "38;5;172m")
HEADER_COLOR=$(style "1;32m")
DEBUG_COLOR=$(style "38;5;019m")
GRAY_TEXT=$(style "0;37m")
FADED_GRAY_TEXT=$(style "38;5;238m")
NO_STYLES=$(style "0m")

# When the NO_COLOR env variable is set, it means the user prefers not to see
# colors in the terminal. In that case, leave terminal colors off.
if [ -n "$NO_COLOR" ]; then
	INFO_COLOR="$NO_STYLES"
	WARNING_COLOR="$NO_STYLES"
	HEADER_COLOR="$NO_STYLES"
fi

log_info() {
	echo -e "${BOLD_TEXT}${INFO_COLOR}[INFO]${GRAY_TEXT} $*${NO_STYLES}"
}

log_warning() {
	echo -e "${BOLD_TEXT}${WARNING_COLOR}[WARNING]${NO_STYLES} $*${NO_STYLES}"
}

log_error() {
	echo -e "${BOLD_TEXT}${ERROR_COLOR}[ERROR]${NO_STYLES} $*${NO_STYLES}"
}

log_debug() {
	echo -e "${BOLD_TEXT}${DEBUG_COLOR}[DEBUG]${FADED_GRAY_TEXT} $*${NO_STYLES}"
}

# Note this won't work if you nest it inside another function that styles text.
# To use it in a `log_info`, you'd have to do this:
#  log_info "Here's something cool: $(highlight_text 'this is highlighted.')"
highlight_text() {
	echo -e "${HIGHLIGHT_COLOR}$*${NO_STYLES}"
}

# Function to print header begin with padding.
log_header_begin() {
	local text="$1"
	local padded_text
	printf -v padded_text "%-78s" "$text"
	echo -e "${HEADER_COLOR}╔${padded_text//?/═}╗${NO_STYLES}"
}

# Function to print header end with padding.
log_header_end() {
	local text="$1"
	local padded_text
	printf -v padded_text "%-78s" "$text"
	echo -e "${HEADER_COLOR}╚${padded_text//?/═}╝${NO_STYLES}"
}

# Function to print a full header with centered text.
log_header() {
	local text="$1"
	local text_length=${#text}
	local padding=$(((78 - text_length) / 2))
	local padded_text
	printf -v padded_text "%*s%s%*s" $padding "" "$text" $((78 - text_length - padding)) ""

	log_header_begin
	echo -e "${HEADER_COLOR}║${padded_text:0:78}║${NO_STYLES}"
	log_header_end
}
