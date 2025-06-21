import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faTimes } from '@fortawesome/free-solid-svg-icons';
import { faCopy } from '@fortawesome/free-regular-svg-icons';
import { toast } from 'react-toastify';

const TagSelector = ({
  availableTags,
  selectedTags,
  onTagSelect,
  onTagRemove,
  showCustomInput,
  customTagName,
  setCustomTagName,
  handleCustomTagAdd,
  maxTags = 7
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [focusedTagIndex, setFocusedTagIndex] = useState(-1);
  const tagsContainerRef = useRef(null);
  const tagRefs = useRef([]);
  const inputRef = useRef(null);



  // Filter available tags based on user input
  const filteredTags = availableTags.filter(tag =>
    tag.toLowerCase().includes(filterText.toLowerCase())
  ).sort((a, b) => a.localeCompare(b));

  const visibleTags = isExpanded ? filteredTags : filteredTags.slice(0, 5);
  const totalFilteredTags = filteredTags.length;

  // Function to handle tag selection
  const handleTagSelect = (tag) => {
    // Call the parent component's tag selection handler
    onTagSelect(tag);

    // Clear both the customTagName and filterText after selection
    setCustomTagName('');
    setFilterText('');

    // Reset the focused index
    setFocusedTagIndex(-1);
  };

  // Function to copy all selected tags
  const copySelectedTags = () => {
    if (selectedTags.length === 0) return;

    // Create a string of tags separated by commas
    const tagString = selectedTags.join(', ');

    // Copy to clipboard
    navigator.clipboard.writeText(tagString)
      .then(() => {
        toast.success("Tags copied to clipboard!");
      })
      .catch(err => {
        alert("No Tags to copy!");
      });
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedTagIndex >= 0 && focusedTagIndex < visibleTags.length) {
        // If a tag is focused, select it
        handleTagSelect(visibleTags[focusedTagIndex]);
      } else if (customTagName.trim() && selectedTags.length < maxTags) {
        // For Enter key, handle multiple tags
        handleCustomTagAdd();
        setCustomTagName('');
        setFilterText('');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();

      // Move focus down through the tag list
      if (focusedTagIndex < visibleTags.length - 1) {
        const newIndex = focusedTagIndex + 1;
        setFocusedTagIndex(newIndex);

        // Scroll to the focused tag if necessary
        if (tagRefs.current[newIndex] && tagsContainerRef.current) {
          const container = tagsContainerRef.current;
          const tag = tagRefs.current[newIndex];

          // Check if the tag is below the visible area
          if (tag.offsetTop + tag.offsetHeight > container.scrollTop + container.offsetHeight) {
            container.scrollTop = tag.offsetTop + tag.offsetHeight - container.offsetHeight;
          }
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();

      // Move focus up through the tag list
      if (focusedTagIndex > 0) {
        const newIndex = focusedTagIndex - 1;
        setFocusedTagIndex(newIndex);

        // Scroll to the focused tag if necessary
        if (tagRefs.current[newIndex] && tagsContainerRef.current) {
          const container = tagsContainerRef.current;
          const tag = tagRefs.current[newIndex];

          // Check if the tag is above the visible area
          if (tag.offsetTop < container.scrollTop) {
            container.scrollTop = tag.offsetTop;
          }
        }
      }
    } else if (e.key === 'Escape') {
      // Clear focus on Escape
      setFocusedTagIndex(-1);
    }
  };

  const handleRemoveTag = (e, tag) => {
    e.preventDefault();
    e.stopPropagation();
    onTagRemove(tag);
  };

  // Update filter when user types
  const handleFilterChange = (e) => {
    setFilterText(e.target.value);
    setIsExpanded(true); // Expand when filtering
    setFocusedTagIndex(-1); // Reset focus when typing
  };

  // Clear filter when adding a custom tag
  useEffect(() => {
    if (selectedTags.length > 0) {
      setFilterText('');
    }
  }, [selectedTags]);


  // Reset tag references when visible tags change
  useEffect(() => {
    tagRefs.current = tagRefs.current.slice(0, visibleTags.length);
  }, [visibleTags]);

  return (
    <div>
      <label className="font-medium pb-4">
        Searching Tags (use searching) (add max 7 tag)
        <span className="text-red-500 pl-2 font-normal text-lg">*</span>
      </label>

      <div className="mb-3 mt-5 flex gap-1 items-start justify-between">
        <div className='flex flex-wrap gap-2 items-center'>
          {selectedTags.map((tag, index) => (
            <div
              key={index}
              className="px-2 rounded flex items-center border border-gray-400"
            >
              <span>{tag}</span>
              <button
                type="button"
                className="ml-2 p-0 text-red-500"
                onClick={(e) => handleRemoveTag(e, tag)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          ))}
        </div>

        {selectedTags.length > 0 && (
          <button
            type="button"
            className="ml-2 px-2 w-10 h-10 border rounded-md border-gray-400"
            onClick={copySelectedTags}
            title="Copy all tags"
          >
            <FontAwesomeIcon icon={faCopy} />
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-2 justify-between">
        <input
          ref={inputRef}
          type="text"
          value={customTagName}
          onChange={(e) => {
            const cursorPosition = e.target.selectionStart;
            const value = e.target.value;

            // Split the input into words
            const words = value.split(' ');

            // Process each word
            const processedWords = words.map(word => {
              // Check if the word is all uppercase (and at least 2 chars to avoid single letters)
              if (word.length >= 2 && word === word.toUpperCase()) {
                // Keep it all uppercase
                return word;
              } else {
                // Otherwise apply the title case (first letter uppercase)
                return word.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
              }
            });

            // Join the words back together
            const formattedValue = processedWords.join(' ');

            // Calculate cursor position change
            const lengthDiff = formattedValue.length - value.length;

            // Update the state value
            setCustomTagName(formattedValue);

            // Also call the filter change handler with the formatted value
            // Create a synthetic event object with the formatted value
            const syntheticEvent = {
              ...e,
              target: {
                ...e.target,
                value: formattedValue
              }
            };
            handleFilterChange(syntheticEvent);

            // Restore cursor position
            setTimeout(() => {
              if (e.target) {
                e.target.selectionStart = e.target.selectionEnd = cursorPosition + lengthDiff;
              }
            }, 0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Enter custom tag name or search... (paste multiple tags separated by commas)"
          className="border p-2 w-full rounded mb-2 dark:bg-gray-800 dark:text-gray-300"
        />

        <button
          type="button"
          onClick={() => {
            handleCustomTagAdd();
            setCustomTagName('');
            setFilterText('');
          }}
          disabled={!customTagName.trim() || selectedTags.length >= maxTags}
          className="text-white border-0 rounded px-5 disabled:opacity-50 h-[42px]"
          style={{ background: "#0777AB" }}
        >
          Add
        </button>
      </div>

      {!showCustomInput && (
        <div className="w-full">
          <div
            ref={tagsContainerRef}
            className="w-full max-h-32 overflow-y-auto"
          >
            <div className="flex flex-wrap gap-2 items-center">
              {visibleTags.map((tag, index) => (
                <button
                  type="button"
                  key={index}
                  ref={el => tagRefs.current[index] = el}
                  onClick={() => handleTagSelect(tag)}
                  disabled={selectedTags.includes(tag) || selectedTags.length >= maxTags}
                  className={`py-1 px-2 rounded border ${focusedTagIndex === index ? 'ring-2 ring-blue-500' : ''
                    } ${selectedTags.includes(tag) ? 'bg-gray-300 text-gray-500' : 'bg-gray-100 text-black'
                    } ${focusedTagIndex === index ? 'border-blue-500' : 'border-gray-300'
                    } dark:bg-gray-800 dark:text-gray-300 text-sm cursor-${selectedTags.includes(tag) ? 'default' : 'pointer'}`}
                >
                  {tag}
                </button>
              ))}

              {totalFilteredTags === 0 && (
                <p className="text-sm text-gray-500">No matching tags found</p>
              )}

              {totalFilteredTags > 5 && !isExpanded && (
                <button
                  type="button"
                  className="ml-2 font-bold cursor-pointer border px-2 py-1 rounded"
                  onClick={toggleExpand}
                >
                  + {totalFilteredTags - 5}
                </button>
              )}

              {totalFilteredTags > 5 && (
                <button
                  type="button"
                  onClick={toggleExpand}
                  className="py-1 px-2 ms-auto border-none bg-transparent text-black dark:text-gray-400"
                >
                  {isExpanded ? (
                    <FontAwesomeIcon icon={faChevronUp} />
                  ) : (
                    <FontAwesomeIcon icon={faChevronDown} />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagSelector;









// import React, { useState, useEffect, useRef } from 'react';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faChevronDown, faChevronUp, faTimes } from '@fortawesome/free-solid-svg-icons';
// import { faCopy } from '@fortawesome/free-regular-svg-icons';

// const TagSelector = ({
//   availableTags,
//   selectedTags,
//   onTagSelect,
//   onTagRemove,
//   showCustomInput,
//   customTagName,
//   setCustomTagName,
//   maxTags = 7
// }) => {
//   const [isExpanded, setIsExpanded] = useState(false);
//   const [filterText, setFilterText] = useState('');
//   const [focusedTagIndex, setFocusedTagIndex] = useState(-1);
//   const tagsContainerRef = useRef(null);
//   const tagRefs = useRef([]);
//   const inputRef = useRef(null);



//   // Filter available tags based on user input
//   const filteredTags = availableTags.filter(tag =>
//     tag.toLowerCase().includes(filterText.toLowerCase())
//   ).sort((a, b) => a.localeCompare(b));

//   const visibleTags = isExpanded ? filteredTags : filteredTags.slice(0, 5);
//   const totalFilteredTags = filteredTags.length;

//   // Function to handle tag selection
//   const handleTagSelect = (tag) => {
//     // Call the parent component's tag selection handler
//     onTagSelect(tag);

//     // Clear both the customTagName and filterText after selection
//     setCustomTagName('');
//     setFilterText('');

//     // Reset the focused index
//     setFocusedTagIndex(-1);
//   };

//   // Function to handle pasting multiple tags
//   const handlePaste = (e) => {
//     // Let the input field handle the paste naturally
//     // We'll process the content when the Add button is clicked
//   };

//   // Function to copy all selected tags
//   const copySelectedTags = () => {
//     if (selectedTags.length === 0) return;

//     // Create a string of tags separated by commas
//     const tagString = selectedTags.join(', ');

//     // Copy to clipboard
//     navigator.clipboard.writeText(tagString)
//       .then(() => {
//         // Optional: Show a success message
//         alert('Tags copied to clipboard!');
//       })
//       .catch(err => {
//         console.error('Failed to copy tags: ', err);
//       });
//   };

//   // Custom function to add multiple tags at once
//   const handleCustomTagAdd = () => {
//     if (!customTagName.trim() || selectedTags.length >= maxTags) return;

//     // Split input by commas, semicolons, or new lines
//     const tagsList = customTagName
//       .split(/[,;\n]+/)
//       .map(tag => tag.trim())
//       .filter(tag => tag.length > 0);

//     console.log('Tags after splitting:', tagsList);

//     // Format tags
//     const formattedTags = tagsList.map(tag => {
//       const words = tag.split(' ');
//       const processedWords = words.map(word => {
//         return word.length >= 2 && word === word.toUpperCase()
//           ? word
//           : word.toLowerCase().replace(/^\w/, c => c.toUpperCase());
//       });
//       return processedWords.join(' ');
//     });

//     console.log('Formatted tags:', formattedTags);

//     // Add tags using push if not already present
//     for (const tag of formattedTags) {
//       if (selectedTags.length >= maxTags) break;
//       if (!selectedTags.includes(tag)) {
//         selectedTags.push(tag); // Directly push to selectedTags
//       }
//     }

//     console.log('Updated selectedTags:', selectedTags);

//     // Clear input fields
//     setCustomTagName('');
//     setFilterText('');
//   };


//   const toggleExpand = () => {
//     setIsExpanded(!isExpanded);
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter') {
//       e.preventDefault();
//       if (focusedTagIndex >= 0 && focusedTagIndex < visibleTags.length) {
//         // If a tag is focused, select it
//         handleTagSelect(visibleTags[focusedTagIndex]);
//       } else if (customTagName.trim() && selectedTags.length < maxTags) {
//         // For Enter key, handle multiple tags
//         handleCustomTagAdd();
//       }
//     } else if (e.key === 'ArrowDown') {
//       e.preventDefault();

//       // Move focus down through the tag list
//       if (focusedTagIndex < visibleTags.length - 1) {
//         const newIndex = focusedTagIndex + 1;
//         setFocusedTagIndex(newIndex);

//         // Scroll to the focused tag if necessary
//         if (tagRefs.current[newIndex] && tagsContainerRef.current) {
//           const container = tagsContainerRef.current;
//           const tag = tagRefs.current[newIndex];

//           // Check if the tag is below the visible area
//           if (tag.offsetTop + tag.offsetHeight > container.scrollTop + container.offsetHeight) {
//             container.scrollTop = tag.offsetTop + tag.offsetHeight - container.offsetHeight;
//           }
//         }
//       }
//     } else if (e.key === 'ArrowUp') {
//       e.preventDefault();

//       // Move focus up through the tag list
//       if (focusedTagIndex > 0) {
//         const newIndex = focusedTagIndex - 1;
//         setFocusedTagIndex(newIndex);

//         // Scroll to the focused tag if necessary
//         if (tagRefs.current[newIndex] && tagsContainerRef.current) {
//           const container = tagsContainerRef.current;
//           const tag = tagRefs.current[newIndex];

//           // Check if the tag is above the visible area
//           if (tag.offsetTop < container.scrollTop) {
//             container.scrollTop = tag.offsetTop;
//           }
//         }
//       }
//     } else if (e.key === 'Escape') {
//       // Clear focus on Escape
//       setFocusedTagIndex(-1);
//     }
//   };

//   const handleRemoveTag = (e, tag) => {
//     e.preventDefault();
//     e.stopPropagation();
//     onTagRemove(tag);
//   };

//   // Update filter when user types
//   const handleFilterChange = (e) => {
//     setFilterText(e.target.value);
//     setIsExpanded(true); // Expand when filtering
//     setFocusedTagIndex(-1); // Reset focus when typing
//   };

//   // Clear filter when adding a custom tag
//   useEffect(() => {
//     if (selectedTags.length > 0) {
//       setFilterText('');
//     }
//   }, [selectedTags]);


//   // Reset tag references when visible tags change
//   useEffect(() => {
//     tagRefs.current = tagRefs.current.slice(0, visibleTags.length);
//   }, [visibleTags]);

//   return (
//     <div>
//       <label className="font-medium pb-4">
//         Searching Tags (use searching) (add max 7 tag)
//         <span className="text-red-500 pl-2 font-normal text-lg">*</span>
//       </label>

//       <div className="mb-3 mt-5 flex gap-1 items-start justify-between">
//         <div className='flex flex-wrap gap-2 items-center'>
//           {selectedTags.map((tag, index) => (
//             <div
//               key={index}
//               className="px-2 rounded flex items-center border border-gray-400"
//             >
//               <span>{tag}</span>
//               <button
//                 type="button"
//                 className="ml-2 p-0 text-red-500"
//                 onClick={(e) => handleRemoveTag(e, tag)}
//               >
//                 <FontAwesomeIcon icon={faTimes} />
//               </button>
//             </div>
//           ))}
//         </div>

//         {selectedTags.length > 0 && (
//           <button
//             type="button"
//             className="ml-2 px-2 w-10 h-10 border rounded-md border-gray-400"
//             onClick={copySelectedTags}
//             title="Copy all tags"
//           >
//             <FontAwesomeIcon icon={faCopy} />
//           </button>
//         )}
//       </div>

//       <div className="flex gap-3 mb-2 justify-between">
//         <input
//           ref={inputRef}
//           type="text"
//           value={customTagName}
//           onChange={(e) => {
//             // Just store the value as is, no formatting for pasted content
//             setCustomTagName(e.target.value);
//             setFilterText(e.target.value);
//           }}
//           onKeyDown={handleKeyDown}
//           onPaste={handlePaste}
//           placeholder="Enter custom tag name or search... (paste multiple tags separated by commas)"
//           className="border p-2 w-full rounded mb-2 dark:bg-gray-800 dark:text-gray-300"
//         />

//         <button
//           type="button"
//           onClick={handleCustomTagAdd}
//           disabled={!customTagName.trim() || selectedTags.length >= maxTags}
//           className="text-white border-0 rounded px-5 disabled:opacity-50 h-[42px]"
//           style={{ background: "#0777AB" }}
//         >
//           Add
//         </button>
//       </div>

//       {!showCustomInput && (
//         <div className="w-full">
//           <div
//             ref={tagsContainerRef}
//             className="w-full max-h-32 overflow-y-auto"
//           >
//             <div className="flex flex-wrap gap-2 items-center">
//               {visibleTags.map((tag, index) => (
//                 <button
//                   type="button"
//                   key={index}
//                   ref={el => tagRefs.current[index] = el}
//                   onClick={() => handleTagSelect(tag)}
//                   disabled={selectedTags.includes(tag) || selectedTags.length >= maxTags}
//                   className={`py-1 px-2 rounded border ${focusedTagIndex === index ? 'ring-2 ring-blue-500' : ''
//                     } ${selectedTags.includes(tag) ? 'bg-gray-300 text-gray-500' : 'bg-gray-100 text-black'
//                     } ${focusedTagIndex === index ? 'border-blue-500' : 'border-gray-300'
//                     } dark:bg-gray-800 dark:text-gray-300 text-sm cursor-${selectedTags.includes(tag) ? 'default' : 'pointer'}`}
//                 >
//                   {tag}
//                 </button>
//               ))}

//               {totalFilteredTags === 0 && (
//                 <p className="text-sm text-gray-500">No matching tags found</p>
//               )}

//               {totalFilteredTags > 5 && !isExpanded && (
//                 <button
//                   type="button"
//                   className="ml-2 font-bold cursor-pointer border px-2 py-1 rounded"
//                   onClick={toggleExpand}
//                 >
//                   + {totalFilteredTags - 5}
//                 </button>
//               )}

//               {totalFilteredTags > 5 && (
//                 <button
//                   type="button"
//                   onClick={toggleExpand}
//                   className="py-1 px-2 ms-auto border-none bg-transparent text-black dark:text-gray-400"
//                 >
//                   {isExpanded ? (
//                     <FontAwesomeIcon icon={faChevronUp} />
//                   ) : (
//                     <FontAwesomeIcon icon={faChevronDown} />
//                   )}
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TagSelector;