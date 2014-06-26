#!/usr/bin/python

# http://stackoverflow.com/questions/55210/algorithm-to-generate-anagrams

MIN_WORD_SIZE = 4 # min size of a word in the output

class Node(object):
    def __init__(self, letter='', final=False, depth=0):
        self.letter = letter
        self.final = final
        self.depth = depth
        self.children = {}
    def add(self, letters):
        node = self
        for index, letter in enumerate(letters):
            if letter not in node.children:
                node.children[letter] = Node(letter, index==len(letters)-1, index+1)
            node = node.children[letter]
    def anagram(self, letters):
        tiles = {}
        for letter in letters:
            tiles[letter] = tiles.get(letter, 0) + 1
        min_length = len(letters)
        return self._anagram(tiles, [], self, min_length)
    def _anagram(self, tiles, path, root, min_length):
        if self.final and self.depth >= MIN_WORD_SIZE:
            word = ''.join(path)
            length = len(word.replace(' ', ''))
            if length >= min_length:
                yield word
            path.append(' ')
            for word in root._anagram(tiles, path, root, min_length):
                yield word
            path.pop()
        for letter, node in self.children.iteritems():
            count = tiles.get(letter, 0)
            if count == 0:
                continue
            tiles[letter] = count - 1
            path.append(letter)
            for word in node._anagram(tiles, path, root, min_length):
                yield word
            path.pop()
            tiles[letter] = count

def load_dictionary(path):
    result = Node()
    for line in open(path, 'r'):
        word = line.strip().lower()
        result.add(word)
    return result

def main():
    print 'Loading word list.'
    words = load_dictionary('words.txt')
    while True:
        letters = raw_input('Enter letters: ')
        letters = letters.lower()
        letters = letters.replace(' ', '')
        if not letters:
            break
        count = 0
        for word in words.anagram(letters):
            print word
            count += 1
        print '%d results.' % count

if __name__ == '__main__':
    main()
