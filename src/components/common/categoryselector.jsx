import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faTimes } from '@fortawesome/free-solid-svg-icons';

const CategorySelector = ({
  availableTags,
  selectedTags,
  onTagSelect,
  onTagRemove,
  showCustomInput,
  customTagName,
  setCustomTagName,
  handleCustomTagAdd,
  maxTags = 1,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (customTagName.trim() && selectedTags.length < maxTags) {
        handleCustomTagAdd();
      }
    }
  };

  const handleRemoveTag = (e, tag) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    onTagRemove(tag);
  };

  const sortedTags = [...availableTags].sort((a, b) => a.localeCompare(b));
  const visibleTags = isExpanded ? sortedTags : sortedTags.slice(0, 5);
  const totalTags = sortedTags.length;

  return (
    <div>
      <label className="font-medium pb-4">
        Sub Category
        <span className="text-red-500 pl-2 font-normal text-lg">*</span>
      </label>

      <div className="mb-3 mt-5 flex flex-wrap gap-2">
        {selectedTags.map((tag, index) => (
          <div
            key={index}
            className="px-2 rounded flex items-center border border-gray-400"
          >
            <span>{tag}</span>
            <button
              type="button" // Explicitly set button type to prevent form submission
              className="ml-2 p-0 text-red-500"
              onClick={(e) => handleRemoveTag(e, tag)}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-2 justify-between">
        <input
          type="text"
          value={customTagName}
          onChange={(e) => setCustomTagName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter category"
          className="border p-2 w-full rounded dark:bg-gray-800 dark:text-gray-300"
        />
        <button
          type="button" // Explicitly set button type
          onClick={handleCustomTagAdd}
          disabled={!customTagName.trim() || selectedTags.length >= maxTags}
          className="text-white border-0 rounded px-5 py-2 disabled:opacity-50"
          style={{ background: "#0777AB" }}
        >
          Add
        </button>
      </div>

      {!showCustomInput && (
        <div className="w-full max-h-32 overflow-y-auto">
          <div className="flex flex-wrap gap-2 items-center">
            {visibleTags
              .filter(tag => tag && tag.trim() !== "") // Remove undefined or empty tags
              .map((tag, index) => (
                <button
                  type="button" // Explicitly set button type
                  key={index}
                  onClick={() => onTagSelect(tag)}
                  disabled={selectedTags.includes(tag) || selectedTags.length >= maxTags}
                  className={`py-1 px-2 rounded border border-gray-300 dark:bg-gray-800 dark:text-gray-300 text-sm ${selectedTags.includes(tag) ? 'bg-gray-300 text-gray-500' : 'bg-gray-100 text-black'
                    } cursor-${selectedTags.includes(tag) ? 'default' : 'pointer'}`}
                >
                  {tag}
                </button>
              ))}


            {totalTags > 5 && !isExpanded && (
              <button
                type="button" // Explicitly set button type
                className="ml-2 font-bold cursor-pointer border px-2 py-1 rounded"
                onClick={toggleExpand}
              >
                + {totalTags - 5}
              </button>
            )}

            {totalTags > 5 && (
              <button
                type="button" // Explicitly set button type
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
      )}
    </div>
  );
};

export default CategorySelector;