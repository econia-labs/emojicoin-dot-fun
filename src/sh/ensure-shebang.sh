#!/bin/sh

for file in "$@"; do
	# Check if the file is a shell script based on its extension.
	if [ "${file##*.}" = "sh" ]; then
		# Check if the file starts with a shebang.
		if ! head -n 1 "$file" | grep -q "^#!"; then
			# If not, add #!/bin/sh to the top of the file.
			echo "Adding shebang to $file"
			(
				printf "#!/bin/sh\n"
				cat "$file"
			) >"$file.tmp" && mv "$file.tmp" "$file"
		fi
	fi
done
